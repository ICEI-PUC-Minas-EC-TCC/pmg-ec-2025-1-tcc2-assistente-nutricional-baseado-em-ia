
'use server';
/**
 * @fileOverview Um agente de IA para chat sobre nutrição.
 *
 * - nutritionChat - Uma função que lida com a conversa sobre nutrição, suportando streaming.
 */

import {ai} from '@/ai/genkit';
import type { NutritionChatInput as NutritionChatClientInput } from '@/lib/schemas'; // Type import for input (now includes apiKey)

export async function* nutritionChat(input: NutritionChatClientInput): AsyncGenerator<string> {
  let modelStreamResult;
  let yieldedSomething = false; 

  // Use a more engaging default prompt if user message is empty
  const directUserMessage = input.userMessage?.trim() ? input.userMessage : "Olá! Fale um pouco sobre nutrição em geral.";
  console.log('[nutritionChat] Using direct userMessage for prompt:', directUserMessage);

  try {
    console.log('[nutritionChat] Attempting to call ai.generateStream with prompt:', directUserMessage, 'and apiKey:', input.apiKey ? 'present' : 'MISSING');
    
    modelStreamResult = ai.generateStream({
      prompt: directUserMessage,
      model: 'googleai/gemini-2.0-flash', // Explicitly set model for clarity
      config: { apiKey: input.apiKey } // Pass the user's API key
    });
    console.log('[nutritionChat] ai.generateStream call completed (stream wrapper object received).');

  } catch (e: any) {
    console.error("[nutritionChat] Critical error BEFORE iterating stream (e.g., during ai.generateStream call):", e);
    const errorMessage = e instanceof Error ? e.message : JSON.stringify(e, Object.getOwnPropertyNames(e));
    yield `Error: Falha crítica ao configurar o modelo de IA (${errorMessage}). Por favor, tente novamente.`;
    return;
  }

  try {
    const modelStream = modelStreamResult?.stream;
    const modelResponsePromise = modelStreamResult?.response; 

    if (!modelStream || typeof modelStream[Symbol.asyncIterator] !== 'function') {
      console.error("[nutritionChat] ai.generateStream did not return a valid async iterable stream. Received:", modelStreamResult);
      yield "Error: Resposta inesperada do modelo de IA (stream inválido). Por favor, tente novamente.";
      if (modelResponsePromise) { // Await even if stream is invalid, to clean up Genkit resources
        try { await modelResponsePromise; } catch (respErr) { console.error("[nutritionChat] Error resolving response promise after invalid stream:", respErr); }
      }
      return;
    }

    console.log("[nutritionChat] Starting iteration over modelStream.");
    for await (const chunk of modelStream) {
      console.log("[nutritionChat] Received stream chunk:", JSON.stringify(chunk, null, 2)); 

      const textChunk = chunk.text;
      const errorChunk = chunk.error;

      if (textChunk !== undefined && textChunk !== null) { 
        console.log("[nutritionChat] Yielding text chunk (could be empty string):", JSON.stringify(textChunk));
        yield textChunk;
        yieldedSomething = true;
      } else if (errorChunk) {
        console.error("[nutritionChat] Explicit error received in stream chunk:", errorChunk);
        const chunkErrorMessage = typeof errorChunk === 'string' ? errorChunk : JSON.stringify(errorChunk, Object.getOwnPropertyNames(errorChunk));
        yield `Error: Problema durante o streaming da IA: ${chunkErrorMessage}.`;
        yieldedSomething = true; 
        if (modelResponsePromise) {
            try { await modelResponsePromise; } catch (respErr) { console.error("[nutritionChat] Error resolving response promise after error chunk:", respErr); }
        }
        return; 
      } else {
        console.warn("[nutritionChat] Unexpected chunk received (no text or error):", JSON.stringify(chunk, null, 2));
      }
    }
    console.log("[nutritionChat] Iteration over modelStream completed.");

    if (modelResponsePromise) {
        try {
            await modelResponsePromise;
            console.log("[nutritionChat] Full model response promise (after successful stream iteration) resolved.");
        } catch (responseError: any) {
            console.error("[nutritionChat] Error resolving full model response promise (after successful stream iteration):", responseError);
        }
    }

    if (!yieldedSomething) {
      console.log("[nutritionChat] AI stream was empty or had no text chunks from model. Yielding one empty string as a diagnostic step.");
      yield ""; 
    }

  } catch (error: any) {
    console.error("[nutritionChat] Error DURING stream iteration (outer try-catch):", error);
    let detailedErrorMessage = "Ocorreu um erro inesperado ao processar a resposta da IA.";
    if (error) {
        if (error.message) {
            detailedErrorMessage = error.message;
        } else if (typeof error === 'string') {
            detailedErrorMessage = error;
        } else {
             // Attempt to serialize the error object for better debugging
            try {
                const errorStatus = (error as any).status ? `Status: ${(error as any).status}. ` : '';
                const errorDetailsString = (error as any).details ? JSON.stringify((error as any).details) : '';
                detailedErrorMessage = `${errorStatus}${ (error as any).message || 'Mensagem de erro desconhecida.'}${errorDetailsString ? ` Detalhes: ${errorDetailsString}` : ''}`;
                if (detailedErrorMessage.length > 500) detailedErrorMessage = detailedErrorMessage.substring(0, 500) + "..."; // Truncate if too long
            } catch (e) {
                detailedErrorMessage = "Erro não serializável ocorrido no servidor durante a iteração do stream.";
            }
        }
    }
    console.error("[nutritionChat] Detailed error message to be sent to client:", detailedErrorMessage);
    yield `Error: ${detailedErrorMessage}. Por favor, tente novamente.`;
  }
}


'use server';
/**
 * @fileOverview Um agente de IA que classifica itens alimentares a partir de uma imagem.
 *
 * - classifyFoodItem - Uma função que lida com o processo de classificação de itens alimentares.
 * - ClassifyFoodItemInput - O tipo de entrada para a função classifyFoodItem.
 * - ClassifyFoodItemOutput - O tipo de retorno para a função classifyFoodItem.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ClassifyFoodItemFlowInput as ClassifyInputType } from '@/lib/schemas';

// Schema for the prompt itself (without apiKey)
const ClassifyFoodItemPromptInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Uma foto de um item alimentar, como um URI de dados que deve incluir um tipo MIME e usar codificação Base64. Formato esperado: 'data:<mimetype>;base64,<dados_codificados>'."
    ),
});
export type ClassifyFoodItemInput = z.infer<typeof ClassifyFoodItemPromptInputSchema>;

const ClassifiedItemSchema = z.object({
  label: z.string().describe('O rótulo do item alimentar identificado em Português (ex: "Torta de Maçã", "Salada Mista").'),
  confidence: z.number().min(0).max(1).describe('A pontuação de confiança estimada para esta identificação, entre 0.0 e 1.0.'),
});

const ClassifyFoodItemOutputSchema = z.object({
  classifications: z
    .array(ClassifiedItemSchema)
    .describe('Uma lista de itens alimentares classificados encontrados na imagem, juntamente com suas pontuações de confiança.'),
});
export type ClassifyFoodItemOutput = z.infer<typeof ClassifyFoodItemOutputSchema>;

// This is the function called by the client
export async function classifyFoodItem(input: ClassifyInputType): Promise<ClassifyFoodItemOutput> {
  return classifyFoodItemFlow(input);
}

const classifyFoodItemPrompt = ai.definePrompt({
  name: 'classifyFoodItemPrompt',
  input: { schema: ClassifyFoodItemPromptInputSchema }, // Prompt schema
  output: { schema: ClassifyFoodItemOutputSchema },
  prompt: `Você é um especialista em classificação de imagens de alimentos. Analise a imagem fornecida e identifique o(s) principal(is) item(ns) alimentar(es) presente(s).
Para cada item alimentar identificado, forneça um rótulo em Português e uma pontuação de confiança estimada entre 0.0 e 1.0 para sua identificação.
Se você identificar vários itens, liste-os. Esforce-se para obter precisão tanto na rotulagem quanto na estimativa de confiança.

Imagem: {{media url=photoDataUri}}`,
});

const classifyFoodItemFlow = ai.defineFlow(
  {
    name: 'classifyFoodItemFlow',
    inputSchema: z.object({ // Flow's direct input schema, including apiKey
        photoDataUri: z.string(),
        apiKey: z.string(),
    }),
    outputSchema: ClassifyFoodItemOutputSchema,
  },
  async (input: ClassifyInputType) => { // input here is ClassifyInputType
    const { apiKey, ...promptPayload } = input;
    const { output } = await classifyFoodItemPrompt(promptPayload, { config: { apiKey } });
    if (!output || !output.classifications) {
        console.warn('ClassifyFoodItemFlow: A saída do modelo foi nula ou as classificações estavam ausentes. Retornando lista vazia.');
        return { classifications: [] };
    }
    return output;
  }
);

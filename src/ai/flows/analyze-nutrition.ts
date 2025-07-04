
'use server';

/**
 * @fileOverview Um agente de IA que analisa a nutrição a partir de uma foto de uma refeição.
 *
 * - analyzeNutritionFromPhoto - Uma função que lida com o processo de análise nutricional.
 * - AnalyzeNutritionFromPhotoInput - O tipo de entrada para a função analyzeNutritionFromPhoto.
 * - AnalyzeNutritionFromPhotoOutput - O tipo de retorno para a função analyzeNutritionFromPhoto.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { AnalyzeNutritionFromPhotoFlowInput as AnalyzeNutritionInputType } from '@/lib/schemas'; // Renamed to avoid conflict

// Using the schema from lib/schemas.ts
const AnalyzeNutritionFromPhotoInputClientSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Uma foto de uma refeição, como um URI de dados que deve incluir um tipo MIME e usar codificação Base64. Formato esperado: 'data:<mimetype>;base64,<dados_codificados>'."
    ),
  // apiKey is part of AnalyzeNutritionInputType from lib/schemas, but not part of the prompt's direct input schema
});
export type AnalyzeNutritionFromPhotoInput = z.infer<typeof AnalyzeNutritionFromPhotoInputClientSchema>;


const AnalyzeNutritionFromPhotoOutputSchema = z.object({
  nutritionalAnalysis: z.object({
    calories: z.number().describe('A contagem estimada de calorias da refeição.'),
    macronutrients: z.object({
      protein: z.number().describe('O conteúdo estimado de proteína em gramas.'),
      carbohydrates: z.number().describe('O conteúdo estimado de carboidratos em gramas.'),
      fat: z.number().describe('O conteúdo estimado de gordura em gramas.'),
    }),
    micronutrients: z
      .array(
        z.object({
          name: z.string().describe('O nome do micronutriente.'),
          amount: z.string().describe('A quantidade estimada do micronutriente.'),
          unit: z.string().describe('A unidade de medida para o micronutriente.'),
        })
      )
      .describe('Uma lista de micronutrientes presentes na refeição.'),
    ingredients: z
      .array(z.string())
      .describe('Uma lista de ingredientes detectados na refeição.'),
  }),
});
export type AnalyzeNutritionFromPhotoOutput = z.infer<
  typeof AnalyzeNutritionFromPhotoOutputSchema
>;

// This is the function called by the client
export async function analyzeNutritionFromPhoto(
  input: AnalyzeNutritionInputType // Uses the more complete type from lib/schemas
): Promise<AnalyzeNutritionFromPhotoOutput> {
  return analyzeNutritionFromPhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeNutritionFromPhotoPrompt',
  input: {schema: AnalyzeNutritionFromPhotoInputClientSchema}, // Schema for the prompt itself (without apiKey)
  output: {schema: AnalyzeNutritionFromPhotoOutputSchema},
  prompt: `Você é um especialista em nutrição. Analise o conteúdo nutricional da refeição na foto e forneça um detalhamento completo.

  Foto: {{media url=photoDataUri}}

  Forneça as seguintes informações:
  - Contagem estimada de calorias
  - Detalhamento de macronutrientes (proteína, carboidratos, gordura) em gramas
  - Lista de micronutrientes e suas quantidades estimadas
  - Lista de ingredientes detectados
  `,
});

const analyzeNutritionFromPhotoFlow = ai.defineFlow(
  {
    name: 'analyzeNutritionFromPhotoFlow',
    inputSchema: z.object({ // Define schema for the flow's direct input here, which includes apiKey
        photoDataUri: z.string(),
        apiKey: z.string(),
    }),
    outputSchema: AnalyzeNutritionFromPhotoOutputSchema,
  },
  async (input) => { // input here is AnalyzeNutritionInputType
    const { apiKey, ...promptPayload } = input;
    const {output} = await prompt(promptPayload, { config: { apiKey } });
    return output!;
  }
);

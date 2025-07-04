
'use server';

/**
 * @fileOverview Gera uma receita com base em uma foto de ingredientes.
 *
 * - generateRecipeFromPhoto - Uma função que gera uma receita a partir de uma foto de ingredientes.
 * - GenerateRecipeFromPhotoInput - O tipo de entrada para a função generateRecipeFromPhoto.
 * - GenerateRecipeFromPhotoOutput - O tipo de retorno para a função generateRecipeFromPhoto.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenerateRecipeFromPhotoFlowInput as GenerateRecipeInputType } from '@/lib/schemas';
import type { UserProfileFormValues } from '@/lib/schemas';


// Schema for the prompt itself (without apiKey and with a potentially simpler userProfile)
const GenerateRecipeFromPhotoPromptInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Uma foto de ingredientes, como um URI de dados que deve incluir um tipo MIME e usar codificação Base64. Formato esperado: 'data:<mimetype>;base64,<dados_codificados>'."
    ),
  userProfile: z.object({ // This is the profile structure expected by the prompt template
    name: z.string().optional(),
    age: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
    dietaryRestrictions: z.string().optional(),
    activityLevel: z.string().optional(),
  }).optional().describe('As informações do perfil do usuário.'),
});
export type GenerateRecipeFromPhotoInput = z.infer<typeof GenerateRecipeFromPhotoPromptInputSchema>;


const GenerateRecipeFromPhotoOutputSchema = z.object({
  recipeName: z.string().describe('O nome da receita gerada.'),
  ingredients: z.array(z.string()).describe('Os ingredientes necessários para a receita.'),
  instructions: z.array(z.string()).describe('As instruções para preparar a receita.'),
  calorieEstimate: z.number().optional().describe('Uma estimativa do total de calorias na receita.'),
  substitutionSuggestions: z.array(z.string()).optional().describe('Sugestões para substituições de ingredientes.'),
});
export type GenerateRecipeFromPhotoOutput = z.infer<typeof GenerateRecipeFromPhotoOutputSchema>;


// This is the function called by the client
export async function generateRecipeFromPhoto(input: GenerateRecipeInputType): Promise<GenerateRecipeFromPhotoOutput> {
  return generateRecipeFromPhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecipeFromPhotoPrompt',
  input: {schema: GenerateRecipeFromPhotoPromptInputSchema}, // Uses the prompt-specific input schema
  output: {schema: GenerateRecipeFromPhotoOutputSchema},
  prompt: `Você é uma IA de geração de receitas. Você pegará uma foto de ingredientes e gerará uma receita usando esses ingredientes.

Considere o seguinte perfil de usuário ao gerar a receita:

{{#if userProfile}}
  Nome: {{userProfile.name}}
  Idade: {{userProfile.age}}
  Peso: {{userProfile.weight}}
  Altura: {{userProfile.height}}
  Restrições Dietéticas: {{userProfile.dietaryRestrictions}}
  Nível de Atividade: {{userProfile.activityLevel}}
{{else}}
  Nenhum perfil de usuário fornecido.
{{/if}}

Foto dos Ingredientes: {{media url=photoDataUri}}

Com base nesses ingredientes, gere uma receita incluindo o nome da receita, ingredientes, instruções, estimativa de calorias e sugestões de substituição, considerando quaisquer restrições alimentares fornecidas.
Formate os ingredientes e as instruções como listas.
IMPORTANTE: Forneça toda a receita (nome, ingredientes, instruções) em Português do Brasil.
`,
});

const generateRecipeFromPhotoFlow = ai.defineFlow(
  {
    name: 'generateRecipeFromPhotoFlow',
    inputSchema: z.object({ // Flow input schema matches GenerateRecipeInputType from lib/schemas
        photoDataUri: z.string(),
        userProfile: z.custom<Partial<UserProfileFormValues>>().optional(), // Use a flexible type for userProfile from client
        apiKey: z.string(),
    }),
    outputSchema: GenerateRecipeFromPhotoOutputSchema,
  },
  async (input: GenerateRecipeInputType) => { // input is GenerateRecipeInputType
    const { apiKey, photoDataUri, userProfile } = input;
    
    // Prepare payload for the prompt, mapping from UserProfileFormValues if needed
    const promptPayload: GenerateRecipeFromPhotoInput = {
        photoDataUri,
        userProfile: userProfile ? {
            name: userProfile.name,
            age: userProfile.age,
            weight: userProfile.weight,
            height: userProfile.height,
            dietaryRestrictions: userProfile.dietaryRestrictions,
            activityLevel: userProfile.activityLevel,
        } : undefined,
    };

    const {output} = await prompt(promptPayload, { config: { apiKey } });
    return output!;
  }
);


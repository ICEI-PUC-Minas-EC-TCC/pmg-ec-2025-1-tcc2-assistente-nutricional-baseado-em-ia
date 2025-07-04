
'use server';
/**
 * @fileOverview Um agente de IA de geração de receitas personalizadas.
 *
 * - generatePersonalizedRecipe - Uma função que lida com o processo de geração de receitas.
 * - GeneratePersonalizedRecipeInput - O tipo de entrada para a função generatePersonalizedRecipe.
 * - GeneratePersonalizedRecipeOutput - O tipo de retorno para a função generatePersonalizedRecipe.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { PersonalizedRecipeFormValues } from '@/lib/schemas'; // Client-side form values
import type { UserProfileFormValues } from '@/lib/schemas';


// This is the schema for the prompt itself, derived from client inputs
const GeneratePersonalizedRecipePromptInputSchema = z.object({
  ingredients: z
    .string()
    .describe('Uma lista de ingredientes disponíveis para usar na receita, separados por vírgula.'),
  dietaryRestrictions: z
    .string()
    .optional()
    .describe('Quaisquer restrições alimentares específicas para esta receita que o usuário tenha (ex: vegano, sem glúten).'),
  userPreferences: z
    .string()
    .optional()
    .describe('As preferências do usuário sobre o tipo de comida que gosta para esta receita (ex: culinária, picante).'),
  userProfile: z.object({ // Profile structure expected by the prompt template
    name: z.string().optional(),
    age: z.number().optional(),
    weight: z.number().optional().describe('Peso em kg.'),
    height: z.number().optional().describe('Altura em cm.'),
    dietaryRestrictions: z.string().optional().describe('Restrições alimentares gerais do perfil do usuário.'),
    activityLevel: z.string().optional(),
  }).optional().describe('As informações do perfil do usuário para consideração geral.'),
});
export type GeneratePersonalizedRecipeInput = z.infer<
  typeof GeneratePersonalizedRecipePromptInputSchema
>;


const GeneratePersonalizedRecipeOutputSchema = z.object({
  recipeName: z.string().describe('O nome da receita.'),
  ingredients: z.array(z.string()).describe('Os ingredientes necessários para a receita.'),
  instructions: z.array(z.string()).describe('As instruções passo a passo para preparar a receita.'),
  calorieEstimate: z
    .string()
    .optional()
    .describe('Uma estimativa do total de calorias na receita.'),
  substitutionSuggestions: z
    .array(z.string())
    .optional()
    .describe('Sugestões para substituições de ingredientes com base nas restrições alimentares.'),
});
export type GeneratePersonalizedRecipeOutput = z.infer<
  typeof GeneratePersonalizedRecipeOutputSchema
>;

// Type for the actual flow input, which includes apiKey and the raw user profile
// PersonalizedRecipeFormValues includes ingredients, dietaryRestrictions, userPreferences, apiKey
interface GeneratePersonalizedRecipeFlowInput extends PersonalizedRecipeFormValues {
  userProfile?: Partial<UserProfileFormValues>; // User profile from client
}


export async function generatePersonalizedRecipe(
  input: GeneratePersonalizedRecipeFlowInput // This is what the client sends
): Promise<GeneratePersonalizedRecipeOutput> {
  console.log('Fluxo generatePersonalizedRecipe chamado com input:', JSON.stringify(input, null, 2));
  return generatePersonalizedRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedRecipePrompt',
  input: {schema: GeneratePersonalizedRecipePromptInputSchema}, // Schema for the prompt
  output: {schema: GeneratePersonalizedRecipeOutputSchema},
  prompt: `Você é um assistente de IA para geração de receitas. Seu objetivo é gerar receitas personalizadas.

Considere o seguinte perfil de usuário ao gerar a receita, se fornecido:
{{#if userProfile}}
  Nome: {{userProfile.name}}
  Idade: {{userProfile.age}}
  Peso: {{userProfile.weight}} kg
  Altura: {{userProfile.height}} cm
  Restrições Dietéticas Gerais do Perfil: {{userProfile.dietaryRestrictions}}
  Nível de Atividade: {{userProfile.activityLevel}}
{{else}}
  Nenhum perfil de usuário fornecido para consideração geral.
{{/if}}

Ingredientes fornecidos para esta receita: {{{ingredients}}}
Restrições Dietéticas Específicas para esta receita (se houver): {{{dietaryRestrictions}}}
Preferências do Usuário para esta receita (se houver): {{{userPreferences}}}

Por favor, gere uma receita que incorpore os ingredientes fornecidos.
A receita deve ser adequada ao perfil do usuário (se fornecido), incluindo suas restrições dietéticas gerais.
Adicionalmente, a receita DEVE respeitar quaisquer restrições dietéticas específicas e preferências do usuário detalhadas para esta receita.
Retorne a receita em um formato estruturado, incluindo nome da receita, lista de ingredientes, instruções passo a passo, uma estimativa do total de calorias e sugestões de substituição de ingredientes, se aplicável.
Certifique-se de que a receita gerada seja deliciosa e fácil de seguir.
IMPORTANTE: Forneça toda a receita (nome, ingredientes, instruções) em Português do Brasil.
`,
});

const generatePersonalizedRecipeFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedRecipeFlow',
    // Define the schema for the flow's direct input, including apiKey and userProfile
    inputSchema: z.object({
        ingredients: z.string(),
        dietaryRestrictions: z.string().optional(),
        userPreferences: z.string().optional(),
        apiKey: z.string(),
        userProfile: z.custom<Partial<UserProfileFormValues>>().optional(),
    }),
    outputSchema: GeneratePersonalizedRecipeOutputSchema,
  },
  async (input: GeneratePersonalizedRecipeFlowInput) => {
    const { apiKey, userProfile: clientUserProfile, ...promptData } = input;

    const promptUserProfile = clientUserProfile ? {
        name: clientUserProfile.name,
        age: clientUserProfile.age,
        weight: clientUserProfile.weight,
        height: clientUserProfile.height,
        dietaryRestrictions: clientUserProfile.dietaryRestrictions,
        activityLevel: clientUserProfile.activityLevel,
    } : undefined;

    const promptPayload: GeneratePersonalizedRecipeInput = {
      ...promptData, 
      userProfile: promptUserProfile,
    };
    
    console.log('Payload para prompt generatePersonalizedRecipe:', JSON.stringify(promptPayload, null, 2));
    
    const rawGenkitOutput = await prompt(promptPayload, { config: { apiKey } });
    console.log('Output bruto do prompt generatePersonalizedRecipe (Genkit):', JSON.stringify(rawGenkitOutput, null, 2));

    const output = rawGenkitOutput.output;
    
    if (!output || !output.recipeName) {
        console.warn('Fluxo generatePersonalizedRecipe: A saída do modelo foi nula ou o nome da receita estava ausente.');
        // Retornar um objeto compatível com o schema de saída, mas indicando falha
        // ou lançar um erro que o cliente pode tratar.
        // Por enquanto, vamos retornar um objeto que o cliente pode identificar como "sem receita".
        return {
            recipeName: "Nenhuma receita encontrada",
            ingredients: ["Não foi possível gerar ingredientes."],
            instructions: ["Não foi possível gerar instruções."],
            calorieEstimate: "N/A",
            substitutionSuggestions: []
        };
    }
    
    console.log('Output final do fluxo generatePersonalizedRecipeFlow:', JSON.stringify(output, null, 2));
    return output;
  }
);


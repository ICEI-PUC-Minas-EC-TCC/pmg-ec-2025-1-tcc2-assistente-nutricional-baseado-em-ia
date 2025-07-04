
'use server';
/**
 * @fileOverview Gera planos de refeições para vários dias com base em uma lista de compras.
 *
 * - generateShoppingListRecipes - Função principal que lida com a geração do plano.
 * - ShoppingListRecipePlannerFlowInput - Tipo de entrada para o fluxo.
 * - ShoppingListRecipePlannerOutput - Tipo de saída do fluxo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { DailyPlanSchema, MealRecipeSchema } from '@/lib/schemas'; // Import DailyPlanSchema e MealRecipeSchema como valores
import type {
  ShoppingListRecipePlannerFlowInput as ShoppingListRecipePlannerClientInput,
  ShoppingListRecipePlannerOutput,
  UserProfileFormValues,
  DailyPlan as DailyPlanType, // Renomear para evitar conflito de tipo
  MealRecipe as MealRecipeType // Renomear para evitar conflito de tipo
} from '@/lib/schemas';

// Schema de entrada para o prompt, derivado do input do cliente
const GenerateShoppingListRecipesPromptInputSchema = z.object({
  shoppingList: z.string().describe('A lista de compras fornecida pelo usuário.'),
  numberOfDays: z.number().int().positive().describe('O número de dias para os quais planejar as refeições.'),
  userProfile: z.object({
    name: z.string().optional(),
    age: z.number().optional(),
    weight: z.number().optional().describe('Peso em kg.'),
    height: z.number().optional().describe('Altura em cm.'),
    dietaryRestrictions: z.string().optional().describe('Restrições alimentares gerais do perfil do usuário.'),
    activityLevel: z.string().optional(),
  }).optional().describe('As informações do perfil do usuário para consideração geral.'),
  includeShoppingSuggestions: z.boolean().optional().describe('Se deve incluir sugestões de compra adicionais.'),
  includeBreakfast: z.boolean().optional().describe('Se deve incluir café da manhã no plano.'),
  includeLunch: z.boolean().optional().describe('Se deve incluir almoço no plano.'),
  includeAfternoonSnack: z.boolean().optional().describe('Se deve incluir lanche da tarde no plano.'),
  includeDinner: z.boolean().optional().describe('Se deve incluir jantar no plano.'),
});
type GenerateShoppingListRecipesPromptInput = z.infer<typeof GenerateShoppingListRecipesPromptInputSchema>;


// Exporta a função que será chamada pelo cliente
export async function generateShoppingListRecipes(
  input: ShoppingListRecipePlannerClientInput
): Promise<ShoppingListRecipePlannerOutput> {
  console.log('Fluxo generateShoppingListRecipes chamado com input:', JSON.stringify(input, null, 2));
  return generateShoppingListRecipesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateShoppingListRecipesPrompt',
  input: { schema: GenerateShoppingListRecipesPromptInputSchema },
  output: { 
    schema: z.object({ 
      dailyPlans: z.array(DailyPlanSchema), 
      shoppingSuggestions: z.array(z.string()).optional(),
    }) 
  },
  // Removida configuração de temperature para testar o padrão
  prompt: `Você é um planejador de refeições e nutricionista especialista.
Sua tarefa é criar um plano de refeições DETALHADO para {{numberOfDays}} dias usando APENAS os ingredientes da lista de compras fornecida.
É crucial que você gere um plano para TODAS as refeições solicitadas (indicadas pelos parâmetros 'includeBreakfast', 'includeLunch', 'includeAfternoonSnack', 'includeDinner') para CADA UM dos {{numberOfDays}} dias.

Para CADA REFEIÇÃO SOLICITADA em CADA DIA, você DEVE fornecer:
1.  Um 'recipeName' (nome da receita em português). Mesmo que não encontre ingredientes adequados da lista para uma refeição solicitada, forneça um recipeName indicando isso (ex: "Lanche da Tarde: Ingredientes insuficientes da lista").
2.  Uma lista de 'ingredients' (ingredientes) usados da lista de compras para aquela receita específica. Se não houver ingredientes adequados, liste os ingredientes como ["Nenhum ingrediente adequado da lista"].
3.  Uma lista de 'instructions' (instruções) claras, concisas e passo a passo para preparar a receita. Se não houver ingredientes adequados, as instruções podem ser ["Não aplicável"].
4.  Opcionalmente, 'notes' (notas) relevantes (ex: tempo de preparo, dicas de cozimento, particularidades para o perfil do usuário). Se não houver ingredientes adequados, a nota pode ser "Não foi possível gerar receita por falta de ingredientes adequados da lista.".

Seja criativo e garanta que as refeições sejam balanceadas e variadas. Evite repetições desnecessárias nas instruções.
Para cada dia, forneça receitas para as seguintes refeições, SE solicitado pelo usuário (conforme os booleanos 'include...'):
{{#if includeBreakfast}}- Café da Manhã (breakfast){{/if}}
{{#if includeLunch}}- Almoço (lunch){{/if}}
{{#if includeAfternoonSnack}}- Lanche da Tarde (afternoonSnack){{/if}}
{{#if includeDinner}}- Jantar (dinner){{/if}}

A lista de compras é:
{{{shoppingList}}}

Considere o seguinte perfil de usuário, se fornecido, ao elaborar as receitas e notas:
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

Formate a saída como um array JSON chamado 'dailyPlans'. Cada elemento em 'dailyPlans' representa um dia e deve ter um campo 'day' (número do dia).
Para cada refeição SOLICITADA (breakfast, lunch, afternoonSnack, dinner) dentro de um dia, inclua um objeto com os campos 'recipeName', 'ingredients' (array de strings), e 'instructions' (array de strings), e opcionalmente 'notes' (string).
Se uma refeição específica (ex: Lanche da Tarde) não for solicitada (o booleano 'include...' correspondente for falso), omita o campo correspondente (ex: afternoonSnack) da saída para aquele dia.
Se uma refeição FOI solicitada mas nenhum ingrediente da lista de compras for adequado, INDIQUE ISSO CLARAMENTE no recipeName e nos campos de ingredientes/instruções, mas AINDA ASSIM inclua o campo da refeição na saída (ex: afternoonSnack) com esta indicação.

{{#if includeShoppingSuggestions}}
Além disso, forneça uma pequena lista de 'shoppingSuggestions' (sugestões de compras) de itens que complementariam bem estas refeições ou que são comumente usados com os ingredientes fornecidos, mas que não estavam na lista original. Mantenha essa lista curta.
{{/if}}

IMPORTANTE: Forneça todas as receitas (nomes, ingredientes, instruções, notas) e sugestões em Português do Brasil.
Priorize usar todos os ingredientes da lista de compras ao longo dos {{numberOfDays}} dias.
Certifique-se de gerar planos para TODOS os {{numberOfDays}} dias solicitados. Se não houver ingredientes suficientes para todos os dias, indique isso nas notas das refeições dos últimos dias.
`,
});

const generateShoppingListRecipesFlow = ai.defineFlow(
  {
    name: 'generateShoppingListRecipesFlow',
    inputSchema: z.object({ 
      shoppingList: z.string(),
      numberOfDays: z.number().int().positive(),
      includeShoppingSuggestions: z.boolean().optional(),
      includeBreakfast: z.boolean().optional(),
      includeLunch: z.boolean().optional(),
      includeAfternoonSnack: z.boolean().optional(),
      includeDinner: z.boolean().optional(),
      apiKey: z.string(),
      userProfile: z.custom<Partial<UserProfileFormValues>>().optional(),
    }),
    outputSchema: z.object({ 
        dailyPlans: z.array(DailyPlanSchema), 
        shoppingSuggestions: z.array(z.string()).optional(),
    }),
  },
  async (input: ShoppingListRecipePlannerClientInput): Promise<ShoppingListRecipePlannerOutput> => {
    const { apiKey, userProfile: clientUserProfile, ...promptData } = input;

    const promptUserProfile = clientUserProfile ? {
      name: clientUserProfile.name,
      age: clientUserProfile.age,
      weight: clientUserProfile.weight,
      height: clientUserProfile.height,
      dietaryRestrictions: clientUserProfile.dietaryRestrictions,
      activityLevel: clientUserProfile.activityLevel,
    } : undefined;

    const promptPayload: GenerateShoppingListRecipesPromptInput = {
      ...promptData,
      userProfile: promptUserProfile,
      includeBreakfast: input.includeBreakfast,
      includeLunch: input.includeLunch,
      includeAfternoonSnack: input.includeAfternoonSnack,
      includeDinner: input.includeDinner,
      includeShoppingSuggestions: input.includeShoppingSuggestions,
    };

    console.log('Payload para prompt generateShoppingListRecipes:', JSON.stringify(promptPayload, null, 2));

    const { output } = await prompt(promptPayload, { config: { apiKey } });
    console.log('Output bruto do prompt:', JSON.stringify(output, null, 2));

    const fallbackRecipeMissing: MealRecipeType = {
        recipeName: "Não foi possível gerar/Não solicitado", // Será mais específico abaixo
        ingredients: ["N/A"],
        instructions: ["N/A"],
        notes: "A IA não conseguiu gerar uma receita para esta refeição com os ingredientes fornecidos ou esta refeição não foi solicitada."
    };

    if (!output || !output.dailyPlans || output.dailyPlans.length === 0) {
      console.warn('Fluxo generateShoppingListRecipes: A saída do modelo foi nula, os planos diários estavam ausentes ou vazios.');
      const numDays = input.numberOfDays || 1;
      const fallbackDailyPlans = Array.from({ length: numDays }, (_, i) => {
        const dayPlan: DailyPlanType = { day: i + 1 }; 
        if (input.includeBreakfast) dayPlan.breakfast = {...fallbackRecipeMissing, recipeName: `Café da Manhã: Não gerado pela IA`, notes: "A IA não conseguiu gerar uma receita para esta refeição."};
        if (input.includeLunch) dayPlan.lunch = {...fallbackRecipeMissing, recipeName: `Almoço: Não gerado pela IA`, notes: "A IA não conseguiu gerar uma receita para esta refeição."};
        if (input.includeAfternoonSnack) dayPlan.afternoonSnack = {...fallbackRecipeMissing, recipeName: `Lanche da Tarde: Não gerado pela IA`, notes: "A IA não conseguiu gerar uma receita para esta refeição."};
        if (input.includeDinner) dayPlan.dinner = {...fallbackRecipeMissing, recipeName: `Jantar: Não gerado pela IA`, notes: "A IA não conseguiu gerar uma receita para esta refeição."};
        return dayPlan;
      });
      
      return {
        dailyPlans: fallbackDailyPlans,
        shoppingSuggestions: input.includeShoppingSuggestions ? ["Não foi possível gerar sugestões de compra."] : undefined,
      };
    }
    
    // Processar a saída da IA para garantir que todos os campos de refeição solicitados estejam presentes
    // e usar o conteúdo da IA se ela fornecer algo, mesmo que seja uma indicação de falha.
    const processedDailyPlans = output.dailyPlans.map(planFromAI => {
        const processedPlan: DailyPlanType = { day: planFromAI.day };

        if (input.includeBreakfast) {
            processedPlan.breakfast = planFromAI.breakfast || {...fallbackRecipeMissing, recipeName: `Café da Manhã: Não retornado pela IA`, notes: "A IA não retornou dados para esta refeição."};
        }
        if (input.includeLunch) {
            processedPlan.lunch = planFromAI.lunch || {...fallbackRecipeMissing, recipeName: `Almoço: Não retornado pela IA`, notes: "A IA não retornou dados para esta refeição."};
        }
        if (input.includeAfternoonSnack) {
            processedPlan.afternoonSnack = planFromAI.afternoonSnack || {...fallbackRecipeMissing, recipeName: `Lanche da Tarde: Não retornado pela IA`, notes: "A IA não retornou dados para esta refeição."};
        }
        if (input.includeDinner) {
            processedPlan.dinner = planFromAI.dinner || {...fallbackRecipeMissing, recipeName: `Jantar: Não retornado pela IA`, notes: "A IA não retornou dados para esta refeição."};
        }
        return processedPlan;
    });
    
    const result: ShoppingListRecipePlannerOutput = {
        dailyPlans: processedDailyPlans,
        shoppingSuggestions: output.shoppingSuggestions
    };

    console.log('Output final do fluxo generateShoppingListRecipesFlow:', JSON.stringify(result, null, 2));
    return result;
  }
);



import { z } from 'zod';

export const UserProfileSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório").optional().or(z.literal('')),
  age: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().int("A idade deve ser um número inteiro.").positive("A idade deve ser um número positivo.").min(1, "A idade deve ser no mínimo 1.").max(120, "A idade deve ser no máximo 120.").optional()
  ),
  weight: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().positive("O peso deve ser um número positivo.").min(1, "O peso deve ser no mínimo 1kg.").max(500, "O peso deve ser no máximo 500kg.").optional()
  ), // em kg
  height: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().positive("A altura deve ser um número positivo.").min(50, "A altura deve ser no mínimo 50cm.").max(300, "A altura deve ser no máximo 300cm.").optional()
  ), // em cm
  dietaryRestrictions: z.string().optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active', '']).optional().or(z.literal('')),
  apiKey: z.string().optional().describe("Chave da API do Google para funcionalidades de IA."),
});

export type UserProfileFormValues = z.infer<typeof UserProfileSchema>;


export const PersonalizedRecipeSchema = z.object({
  ingredients: z.string().min(3, "Por favor, liste alguns ingredientes."),
  dietaryRestrictions: z.string().optional(),
  userPreferences: z.string().optional(),
  apiKey: z.string().min(1, "Google API Key é obrigatória."),
});
export type PersonalizedRecipeFormValues = z.infer<typeof PersonalizedRecipeSchema>;

export const GenerateRecipeFromPhotoFlowInputSchema = z.object({
  photoDataUri: z.string(),
  userProfile: UserProfileSchema.omit({apiKey: true}).optional(),
  apiKey: z.string().min(1, "Google API Key é obrigatória."),
});
export type GenerateRecipeFromPhotoFlowInput = z.infer<typeof GenerateRecipeFromPhotoFlowInputSchema>;

export const AnalyzeNutritionFromPhotoFlowInputSchema = z.object({
  photoDataUri: z.string(),
  apiKey: z.string().min(1, "Google API Key é obrigatória."),
});
export type AnalyzeNutritionFromPhotoFlowInput = z.infer<typeof AnalyzeNutritionFromPhotoFlowInputSchema>;

export const ClassifyFoodItemFlowInputSchema = z.object({
  photoDataUri: z.string(),
  apiKey: z.string().min(1, "Google API Key é obrigatória."),
});
export type ClassifyFoodItemFlowInput = z.infer<typeof ClassifyFoodItemFlowInputSchema>;


export const RegisterSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  confirmPassword: z.string().min(6, "A confirmação da senha deve ter pelo menos 6 caracteres.")
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});
export type RegisterFormValues = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(1, "A senha é obrigatória."),
});
export type LoginFormValues = z.infer<typeof LoginSchema>;

export const NutritionChatInputSchema = z.object({
  userMessage: z.string().describe('A mensagem ou pergunta do usuário.'),
  userProfile: UserProfileSchema.omit({apiKey: true}).optional().describe('O perfil do usuário, se disponível, para personalizar as respostas.'),
  apiKey: z.string().min(1, "Google API Key é obrigatória para o chat.").describe("Chave API do Google do usuário.")
});
export type NutritionChatInput = z.infer<typeof NutritionChatInputSchema>;

export const NutritionChatOutputSchema = z.object({
  aiResponse: z.string().describe('A resposta da IA para a mensagem do usuário.'),
});
export type NutritionChatOutput = z.infer<typeof NutritionChatOutputSchema>;

// Schema para uma receita individual dentro do plano diário
export const MealRecipeSchema = z.object({
  recipeName: z.string().describe("O nome da receita para esta refeição."),
  ingredients: z.array(z.string()).describe("Lista de ingredientes para esta receita, usando apenas itens da lista de compras fornecida."),
  instructions: z.array(z.string()).describe("Instruções passo a passo para preparar esta receita."),
  notes: z.string().optional().describe("Quaisquer notas ou dicas adicionais para esta receita (ex: tempo de preparo, dicas de cozimento).")
});
export type MealRecipe = z.infer<typeof MealRecipeSchema>;

// Schema para o plano diário retornado pela IA
export const DailyPlanSchema = z.object({
  day: z.number().describe("O número do dia no planejamento (ex: 1, 2)."),
  breakfast: MealRecipeSchema.optional().describe("Receita para o café da manhã."),
  lunch: MealRecipeSchema.optional().describe("Receita para o almoço."),
  afternoonSnack: MealRecipeSchema.optional().describe("Receita para o lanche da tarde."),
  dinner: MealRecipeSchema.optional().describe("Receita para o jantar."),
});
export type DailyPlan = z.infer<typeof DailyPlanSchema>;

// Schema para o formulário do Planejador de Compras
export const ShoppingListRecipePlannerSchema = z.object({
  shoppingList: z.string().min(10, "A lista de compras parece muito curta. Por favor, adicione mais itens."),
  numberOfDays: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 1 : Number(val)),
    z.number().int("O número de dias deve ser um inteiro.").min(1, "Pelo menos 1 dia é necessário.").max(14, "O planejamento pode ser feito para no máximo 14 dias.")
  ),
  includeShoppingSuggestions: z.boolean().optional().default(false),
  includeBreakfast: z.boolean().optional().default(true),
  includeLunch: z.boolean().optional().default(true),
  includeAfternoonSnack: z.boolean().optional().default(true),
  includeDinner: z.boolean().optional().default(true),
  apiKey: z.string().min(1, "Google API Key é obrigatória."),
});
export type ShoppingListRecipePlannerFormValues = z.infer<typeof ShoppingListRecipePlannerSchema>;

// Schema para a entrada do fluxo de IA do Planejador de Compras
export interface ShoppingListRecipePlannerFlowInput extends ShoppingListRecipePlannerFormValues {
  userProfile?: Partial<UserProfileFormValues>;
}

// Schema para a saída do fluxo de IA do Planejador de Compras
export const ShoppingListRecipePlannerOutputSchema = z.object({
  dailyPlans: z.array(DailyPlanSchema).describe("Uma lista de planos de refeições, um para cada dia solicitado."),
  shoppingSuggestions: z.array(z.string()).optional().describe("Sugestões de itens adicionais para compra."),
});
export type ShoppingListRecipePlannerOutput = z.infer<typeof ShoppingListRecipePlannerOutputSchema>;

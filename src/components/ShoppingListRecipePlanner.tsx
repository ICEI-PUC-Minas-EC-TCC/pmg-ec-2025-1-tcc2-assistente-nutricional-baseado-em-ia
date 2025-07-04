
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingListRecipePlannerSchema, type ShoppingListRecipePlannerFormValues, type ShoppingListRecipePlannerOutput, type DailyPlan, type MealRecipe } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { generateShoppingListRecipes } from "@/ai/flows/generate-shopping-list-recipes";
import { LoadingSpinner } from "./LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, AlertCircle, ShoppingCart, CalendarDays, Utensils, Lightbulb, CheckCheck, ListChecks, BookOpenText, Salad, Cookie, GlassWater, Soup, Info } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import Link from "next/link";

const mealTypes = [
  { id: 'includeBreakfast', label: 'Café da Manhã' },
  { id: 'includeLunch', label: 'Almoço' },
  { id: 'includeAfternoonSnack', label: 'Lanche da Tarde' },
  { id: 'includeDinner', label: 'Jantar' },
] as const;


// Subcomponente para exibir uma receita de refeição
const MealRecipeDisplay: React.FC<{ mealName: string; recipe?: MealRecipe; mealIcon?: React.ReactNode }> = ({ mealName, recipe, mealIcon }) => {
  if (!recipe || !recipe.recipeName || recipe.recipeName === "N/A" || recipe.recipeName.toLowerCase().includes("não foi possível gerar") || recipe.recipeName.toLowerCase().includes("nenhuma opção")) {
    return (
        <div className="pl-4 py-2 my-1">
            <h4 className="font-medium text-sm text-muted-foreground mb-1 flex items-center gap-2">
                {mealIcon || <Info size={16} />} {mealName}
            </h4>
            <p className="text-xs text-muted-foreground ml-6 italic">{recipe?.recipeName || "Não solicitado ou não foi possível gerar."}</p>
        </div>
    );
  }

  return (
    <div className="pl-4 py-3 my-2 border-l-2 border-primary/30 bg-card rounded-r-md shadow-sm hover:shadow-md transition-shadow duration-200">
      <h4 className="font-semibold text-md text-primary mb-2 flex items-center gap-2">
        {mealIcon || <Utensils size={18} />} {mealName}: {recipe.recipeName}
      </h4>
      {recipe.ingredients && recipe.ingredients.length > 0 && recipe.ingredients[0] !== "N/A" && (
        <div className="mb-3">
          <h5 className="font-medium text-sm text-foreground/90 mb-1 ml-2 flex items-center gap-1.5"><ListChecks size={16} className="text-accent" /> Ingredientes:</h5>
          <ul className="list-none space-y-0.5 pl-7 text-xs">
            {recipe.ingredients.map((ingredient, i) => (
              <li key={i} className="flex items-start">
                <span className="mr-2 mt-0.5 text-primary">&bull;</span>
                <span>{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {recipe.instructions && recipe.instructions.length > 0 && recipe.instructions[0] !== "N/A" && (
        <div className="mb-3">
          <h5 className="font-medium text-sm text-foreground/90 mb-1 ml-2 flex items-center gap-1.5"><BookOpenText size={16} className="text-accent"/> Instruções:</h5>
          <ol className="list-none space-y-1.5 pl-7 text-xs">
            {recipe.instructions.map((instruction, i) => (
              <li key={i} className="flex items-start">
                <span className="font-semibold text-primary mr-2">{i + 1}.</span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {recipe.notes && (
         <p className="text-xs text-muted-foreground mt-2 ml-7 italic"><Info size={12} className="inline mr-1"/>Nota: {recipe.notes}</p>
      )}
    </div>
  );
};


export default function ShoppingListRecipePlanner() {
  const [recipeOutput, setRecipeOutput] = useState<ShoppingListRecipePlannerOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile, isLoading: profileLoading } = useUserProfile();

  const form = useForm<ShoppingListRecipePlannerFormValues>({
    resolver: zodResolver(ShoppingListRecipePlannerSchema),
    defaultValues: {
      shoppingList: "",
      numberOfDays: 3,
      includeShoppingSuggestions: false,
      includeBreakfast: true,
      includeLunch: true,
      includeAfternoonSnack: true,
      includeDinner: true,
      apiKey: "",
    },
  });

  useEffect(() => {
    if (profile?.apiKey) {
      form.setValue("apiKey", profile.apiKey);
    }
  }, [profile?.apiKey, form.setValue]);

  async function onSubmit(data: ShoppingListRecipePlannerFormValues) {
    console.log("ShoppingListRecipePlanner onSubmit - Form data:", JSON.stringify(data, null, 2)); // Log dos dados do formulário
    if (!profile?.apiKey) {
      toast({
        title: "API Key Necessária",
        description: "Por favor, configure sua Google API Key na página de Perfil.",
        variant: "destructive",
      });
      setApiError("Google API Key não configurada no seu perfil.");
      return;
    }
     if (!data.includeBreakfast && !data.includeLunch && !data.includeAfternoonSnack && !data.includeDinner) {
      toast({
        title: "Nenhuma Refeição Selecionada",
        description: "Por favor, selecione pelo menos um tipo de refeição para o planejamento.",
        variant: "default",
      });
      return;
    }

    setIsLoading(true);
    setApiError(null);
    setRecipeOutput(null);

    const inputForAI: ShoppingListRecipePlannerFlowInput = {
      ...data,
      apiKey: profile.apiKey,
      userProfile: profile ? {
        name: profile.name || undefined,
        age: profile.age || undefined,
        weight: profile.weight || undefined,
        height: profile.height || undefined,
        dietaryRestrictions: profile.dietaryRestrictions || undefined,
        activityLevel: profile.activityLevel || undefined,
      } : undefined,
    };

    try {
      console.log("Enviando para generateShoppingListRecipes:", JSON.stringify(inputForAI, null, 2));
      const result = await generateShoppingListRecipes(inputForAI);
      console.log("Resultado recebido de generateShoppingListRecipes:", JSON.stringify(result, null, 2));

      if (result && result.dailyPlans && result.dailyPlans.length > 0) {
        setRecipeOutput(result);
        toast({
          title: "Plano de Refeições Gerado!",
          description: `Seu plano para ${data.numberOfDays} dia(s) está pronto.`,
        });
      } else {
        const errorMsg = "A IA não retornou um plano de refeições válido. Verifique sua lista de compras ou tente simplificar o pedido.";
        setApiError(errorMsg);
        console.warn("generateShoppingListRecipes retornou resultado inválido ou vazio:", result);
        toast({
          title: "Nenhum Plano Encontrado",
          description: errorMsg,
          variant: "default"
        });
      }
    } catch (e) {
      console.error("Erro em onSubmit ShoppingListRecipePlanner:", e);
      const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
      setApiError(`Falha ao gerar o plano de refeições: ${errorMessage}`);
      toast({
        title: "Erro na Geração",
        description: `Não foi possível gerar o plano: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const canSubmit = !isLoading && !profileLoading && profile?.apiKey;

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <CardTitle className="font-headline text-2xl md:text-3xl">Planejador de Refeições com Lista de Compras</CardTitle>
          </div>
          <CardDescription>
            Insira sua lista de compras e o número de dias. A IA criará um plano de refeições e, opcionalmente, sugerirá itens adicionais.
            Requer Google API Key configurada no perfil.
          </CardDescription>
        </CardHeader>
        {profileLoading ? (
          <CardContent><LoadingSpinner text="Carregando dados do perfil..." /></CardContent>
        ) : !profile?.apiKey ? (
          <CardContent>
            <Alert variant="default" className="bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300">
              <AlertCircle className="h-4 w-4 !text-yellow-600 dark:!text-yellow-400" />
              <AlertTitle>Google API Key Necessária</AlertTitle>
              <AlertDescription>
                Para usar esta funcionalidade, por favor, adicione sua Google API Key em seu <Button variant="link" asChild className="p-0 h-auto"><Link href="/profile">Perfil</Link></Button>.
              </AlertDescription>
            </Alert>
          </CardContent>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="shoppingList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Sua Lista de Compras</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Arroz, feijão, peito de frango, brócolis, tomate, cebola, alho, azeite, etc."
                          {...field}
                          className="min-h-[120px] resize-y text-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        Liste todos os ingredientes que você possui ou comprou, separados por vírgula ou um por linha.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numberOfDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Número de Dias para Planejar</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="14" {...field} className="w-32 text-sm" 
                               onChange={e => field.onChange(e.target.value === '' ? 1 : Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                    <FormLabel className="text-base">Quais refeições incluir no planejamento?</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {mealTypes.map(meal => (
                        <FormField
                        key={meal.id}
                        control={form.control}
                        name={meal.id}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-3 shadow-sm hover:shadow-md transition-shadow">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                                {meal.label}
                            </FormLabel>
                            </FormItem>
                        )}
                        />
                    ))}
                    </div>
                </div>

                <FormField
                  control={form.control}
                  name="includeShoppingSuggestions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Incluir Sugestões de Compra Adicionais?</FormLabel>
                        <FormDescription className="text-xs">
                          A IA pode sugerir alguns itens extras que complementariam seu plano.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (<FormItem className="hidden"><FormControl><Input type="hidden" {...field} /></FormControl></FormItem>)}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full md:w-auto" disabled={!canSubmit}>
                  {isLoading ? <LoadingSpinner size="sm" text="Gerando Plano..." /> : <> <CalendarDays className="mr-2"/> Gerar Plano de Refeições</>}
                </Button>
              </CardFooter>
            </form>
          </Form>
        )}
      </Card>

      {apiError && !(!profileLoading && !profile?.apiKey && apiError.includes("Google API Key não configurada")) && (
        <Alert variant="destructive" className="max-w-3xl mx-auto">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Falha na Geração do Plano</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {recipeOutput && recipeOutput.dailyPlans && recipeOutput.dailyPlans.length > 0 && (
        <Card className="w-full max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
                <Utensils className="w-8 h-8 text-primary" />
                <CardTitle className="font-headline text-2xl md:text-3xl">Seu Plano de Refeições</CardTitle>
            </div>
            <CardDescription>
              Aqui está o plano de refeições gerado pela IA para {form.getValues("numberOfDays")} dia(s), utilizando sua lista de compras.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full" defaultValue={`day-0`}>
              {recipeOutput.dailyPlans.map((plan, index) => (
                <AccordionItem value={`day-${index}`} key={index}>
                  <AccordionTrigger className="text-lg font-semibold hover:text-primary font-headline">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={20}/> Dia {plan.day}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-1 pt-3">
                    {form.getValues("includeBreakfast") && (plan.breakfast) && (
                        <MealRecipeDisplay mealName="Café da Manhã" recipe={plan.breakfast} mealIcon={<GlassWater size={18} className="text-blue-500"/>} />
                    )}
                    {form.getValues("includeLunch") && (plan.lunch) && (
                        <MealRecipeDisplay mealName="Almoço" recipe={plan.lunch} mealIcon={<Salad size={18} className="text-green-500"/>} />
                    )}
                    {form.getValues("includeAfternoonSnack") && (plan.afternoonSnack) && (
                        <MealRecipeDisplay mealName="Lanche da Tarde" recipe={plan.afternoonSnack} mealIcon={<Cookie size={18} className="text-yellow-600"/>} />
                    )}
                    {form.getValues("includeDinner") && (plan.dinner) && (
                        <MealRecipeDisplay mealName="Jantar" recipe={plan.dinner} mealIcon={<Soup size={18} className="text-red-500"/>} />
                    )}
                    {/* Fallback if no meal types selected for this day's render, though form validation should prevent this */}
                    {!form.getValues("includeBreakfast") && !form.getValues("includeLunch") && !form.getValues("includeAfternoonSnack") && !form.getValues("includeDinner") && (
                        <p className="text-sm text-muted-foreground pl-6 py-2">Nenhuma refeição selecionada para planejamento neste dia.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {recipeOutput.shoppingSuggestions && recipeOutput.shoppingSuggestions.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <div className="flex items-center gap-3 mb-3">
                    <Lightbulb className="w-6 h-6 text-accent" />
                    <h3 className="font-headline text-xl md:text-2xl text-accent">Sugestões de Compra Adicionais</h3>
                </div>
                <ul className="list-none space-y-1 pl-2">
                  {recipeOutput.shoppingSuggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start text-sm text-foreground/90">
                       <CheckCheck className="w-4 h-4 text-green-600 mr-2 mt-0.5 shrink-0" /> 
                       <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


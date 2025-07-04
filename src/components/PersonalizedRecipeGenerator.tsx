
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
import { PersonalizedRecipeSchema, type PersonalizedRecipeFormValues } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generatePersonalizedRecipe, type GeneratePersonalizedRecipeOutput } from "@/ai/flows/personalized-recipe";
import RecipeDisplay from "./RecipeDisplay";
import { LoadingSpinner } from "./LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, AlertCircle } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import Link from "next/link";


export default function PersonalizedRecipeGenerator() {
  const [recipeOutput, setRecipeOutput] = useState<GeneratePersonalizedRecipeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile, isLoading: profileLoading } = useUserProfile();

  const form = useForm<PersonalizedRecipeFormValues>({
    resolver: zodResolver(PersonalizedRecipeSchema),
    defaultValues: {
      ingredients: "",
      dietaryRestrictions: "",
      userPreferences: "",
      apiKey: "", 
    },
  });

  useEffect(() => {
    if (profile?.apiKey) {
      form.setValue("apiKey", profile.apiKey);
    }
  }, [profile?.apiKey, form.setValue]);


  async function onSubmit(data: PersonalizedRecipeFormValues) {
    if (!profile?.apiKey) {
       toast({
        title: "API Key Necessária",
        description: "Por favor, configure sua Google API Key na página de Perfil para usar esta funcionalidade.",
        variant: "destructive",
      });
      setError("Google API Key não configurada no seu perfil.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecipeOutput(null); // Limpa a receita anterior antes de uma nova chamada

    const inputForAI = {
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
    
    console.log('Enviando para generatePersonalizedRecipe:', JSON.stringify(inputForAI, null, 2));

    try {
      const result = await generatePersonalizedRecipe(inputForAI as any); 
      console.log('Resultado recebido de generatePersonalizedRecipe:', JSON.stringify(result, null, 2));

      if (result && result.recipeName && result.recipeName !== "Nenhuma receita encontrada") {
        setRecipeOutput(result);
        setError(null); // Limpa erro anterior se sucesso
        toast({
          title: "Receita Gerada!",
          description: `Aproveite sua nova receita: ${result.recipeName}`,
        });
      } else {
        // Caso em que a IA retorna recipeName: "Nenhuma receita encontrada" ou result/recipeName é nulo.
        const errorMessage = result?.recipeName === "Nenhuma receita encontrada" 
            ? "A IA não conseguiu gerar uma receita com os dados fornecidos. Tente refinar sua solicitação ou ingredientes." 
            : "A IA não retornou uma receita válida. Tente refinar sua solicitação.";
        setError(errorMessage);
        setRecipeOutput(null); // Garante que nenhuma receita seja exibida
        toast({
          title: "Nenhuma Receita Encontrada",
          description: errorMessage,
          variant: "default"
        });
      }
    } catch (e) {
      console.error("Erro em onSubmit PersonalizedRecipeGenerator:", e);
      const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
      setError(`Falha ao gerar receita. ${errorMessage}`);
      setRecipeOutput(null); // Garante que nenhuma receita seja exibida em caso de erro
      toast({
        title: "Erro na Geração",
        description: `Não foi possível gerar a receita: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const canSubmit = !isLoading && !profileLoading && profile?.apiKey;

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Gerador de Receitas Personalizadas</CardTitle>
          <CardDescription>
            Insira os ingredientes disponíveis, necessidades dietéticas e preferências para obter uma receita personalizada.
            Suas informações de perfil e Google API Key (configurada no perfil) serão usadas.
          </CardDescription>
        </CardHeader>
        {profileLoading ? (
          <CardContent>
            <LoadingSpinner text="Carregando dados do perfil..." />
          </CardContent>
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
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ingredientes Disponíveis</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: peito de frango, brócolis, arroz, molho de soja"
                          {...field}
                          className="min-h-[100px] resize-y"
                        />
                      </FormControl>
                      <FormDescription>
                        Liste os principais ingredientes que você tem em mãos, separados por vírgulas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dietaryRestrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restrições Dietéticas Específicas para esta Receita (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: vegano, sem glúten, sem nozes" {...field} />
                      </FormControl>
                      <FormDescription>
                        Especifique quaisquer limitações alimentares adicionais para esta receita.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userPreferences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferências de Culinária ou Prato para esta Receita (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: italiana, picante, refeição rápida, macarrão" {...field} />
                      </FormControl>
                      <FormDescription>
                        Que tipo de comida você está com vontade para esta receita?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full md:w-auto" disabled={!canSubmit}>
                  {isLoading ? <LoadingSpinner size="sm" text="Gerando..." /> : "Gerar Receita"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        )}
      </Card>

      {/* Exibe o erro se houver um E se NÃO for o erro específico de API Key (que já é tratado acima com um Alert específico) */}
      {error && !(error.includes("Google API Key não configurada no seu perfil.")) && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Aviso</AlertTitle> 
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {recipeOutput && <RecipeDisplay recipe={recipeOutput} />}
    </div>
  );
}

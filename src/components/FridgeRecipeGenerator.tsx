
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useUserProfile } from "@/hooks/useUserProfile";
import ImageUploadArea from "./ImageUploadArea";
import { generateRecipeFromPhoto, type GenerateRecipeFromPhotoOutput } from "@/ai/flows/generate-recipe";
import type { GenerateRecipeFromPhotoFlowInput } from "@/lib/schemas";
import RecipeDisplay from "./RecipeDisplay";
import { LoadingSpinner } from "./LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function FridgeRecipeGenerator() {
  const { file, preview, dataUri, error: fileError, handleFileChange, reset: resetFile } = useFileUpload();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const [recipeOutput, setRecipeOutput] = useState<GenerateRecipeFromPhotoOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleSubmit() {
    if (!dataUri) {
      toast({
        title: "Nenhuma Imagem",
        description: "Por favor, envie uma imagem do conteúdo da sua geladeira.",
        variant: "destructive",
      });
      return;
    }
     if (!profile?.apiKey) {
      toast({
        title: "API Key Necessária",
        description: "Por favor, configure sua Google API Key na página de Perfil para usar esta funcionalidade.",
        variant: "destructive",
      });
      setApiError("Google API Key não configurada no seu perfil.");
      return;
    }

    setIsLoading(true);
    setApiError(null);
    setRecipeOutput(null);

    const input: GenerateRecipeFromPhotoFlowInput = {
      photoDataUri: dataUri,
      apiKey: profile.apiKey,
      ...(profile && { 
        userProfile: { // Pass only the fields expected by the flow's userProfile
          name: profile.name || undefined,
          age: profile.age || undefined,
          weight: profile.weight || undefined,
          height: profile.height || undefined,
          dietaryRestrictions: profile.dietaryRestrictions || undefined,
          activityLevel: profile.activityLevel || undefined,
        }
      })
    };
    
    try {
      const result = await generateRecipeFromPhoto(input);
      setRecipeOutput(result);
      toast({
        title: "Receita Gerada!",
        description: `Aqui está uma receita para você: ${result.recipeName}`,
      });
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
      setApiError(`Falha ao gerar receita a partir da imagem. ${errorMessage}`);
      toast({
        title: "Erro",
        description: "Não foi possível gerar a receita. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const canSubmit = dataUri && !isLoading && !fileError && profile?.apiKey && !profileLoading;

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Ingredientes da Geladeira para Receita</CardTitle>
          <CardDescription>
            Envie uma foto dos ingredientes da sua geladeira e nós sugeriremos uma receita!
            Os dados do perfil do usuário e uma Google API Key (configurada no perfil) são necessários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <LoadingSpinner text="Carregando perfil..." />
          ) : !profile?.apiKey ? (
             <Alert variant="default" className="bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300">
              <AlertCircle className="h-4 w-4 !text-yellow-600 dark:!text-yellow-400" />
              <AlertTitle>Google API Key Necessária</AlertTitle>
              <AlertDescription>
                Para usar esta funcionalidade, por favor, adicione sua Google API Key em seu <Button variant="link" asChild className="p-0 h-auto"><Link href="/profile">Perfil</Link></Button>.
              </AlertDescription>
            </Alert>
          ) : (
            <ImageUploadArea
              onFileChange={handleFileChange}
              previewUrl={preview}
              error={fileError}
              isProcessing={isLoading && !apiError && !recipeOutput} 
              reset={() => {
                resetFile();
                setRecipeOutput(null);
                setApiError(null);
              }}
              disabled={isLoading || !profile?.apiKey}
            />
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            className="w-full md:w-auto"
            disabled={!canSubmit}
          >
            {isLoading ? <LoadingSpinner size="sm" text="Gerando Receita..." /> : "Gerar Receita da Imagem"}
          </Button>
        </CardFooter>
      </Card>

      {apiError && !(!profileLoading && !profile?.apiKey && apiError.includes("Google API Key não configurada")) && (
         <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Falha na Geração</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {recipeOutput && <RecipeDisplay recipe={recipeOutput} />}
    </div>
  );
}

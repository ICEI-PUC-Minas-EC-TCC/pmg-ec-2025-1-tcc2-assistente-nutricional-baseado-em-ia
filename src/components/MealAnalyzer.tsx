
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import ImageUploadArea from "./ImageUploadArea";
import { analyzeNutritionFromPhoto, type AnalyzeNutritionFromPhotoOutput } from "@/ai/flows/analyze-nutrition";
import NutritionDisplay from "./NutritionDisplay";
import { LoadingSpinner } from "./LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, AlertCircle } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import Link from "next/link";


export default function MealAnalyzer() {
  const { file, preview, dataUri, error: fileError, handleFileChange, reset: resetFile } = useFileUpload();
  const [analysisOutput, setAnalysisOutput] = useState<AnalyzeNutritionFromPhotoOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile, isLoading: profileLoading } = useUserProfile();

  async function handleSubmit() {
    if (!dataUri) {
      toast({
        title: "Nenhuma Imagem",
        description: "Por favor, envie uma imagem da sua refeição.",
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
    setAnalysisOutput(null);
    
    try {
      const result = await analyzeNutritionFromPhoto({ photoDataUri: dataUri, apiKey: profile.apiKey });
      setAnalysisOutput(result);
      toast({
        title: "Análise Concluída!",
        description: "As informações nutricionais foram geradas.",
      });
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
      setApiError(`Falha ao analisar a imagem da refeição. ${errorMessage}`);
      toast({
        title: "Erro",
        description: "Não foi possível analisar a refeição. Por favor, tente novamente.",
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
          <CardTitle className="font-headline text-2xl">Análise Nutricional da Refeição</CardTitle>
          <CardDescription>
            Envie uma foto da sua refeição para obter uma análise nutricional por IA. Requer uma Google API Key configurada em seu perfil.
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
              isProcessing={isLoading && !apiError && !analysisOutput}
              reset={() => {
                resetFile();
                setAnalysisOutput(null);
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
            {isLoading ? <LoadingSpinner size="sm" text="Analisando Refeição..." /> : "Analisar Foto da Refeição"}
          </Button>
        </CardFooter>
      </Card>

      {apiError && !(!profileLoading && !profile?.apiKey && apiError.includes("Google API Key não configurada")) && (
         <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Falha na Análise</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {analysisOutput && <NutritionDisplay analysis={analysisOutput.nutritionalAnalysis} />}
    </div>
  );
}

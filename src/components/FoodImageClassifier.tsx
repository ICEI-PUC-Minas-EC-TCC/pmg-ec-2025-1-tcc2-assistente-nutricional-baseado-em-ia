
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import ImageUploadArea from "./ImageUploadArea";
import { LoadingSpinner } from "./LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { ClassifiedFoodItem } from "@/types";
import { CheckCheck, SearchCheck, Terminal, AlertCircle } from "lucide-react";
import { classifyFoodItem, type ClassifyFoodItemOutput } from "@/ai/flows/classify-food-item-flow";
import type { ClassifyFoodItemFlowInput } from "@/lib/schemas";
import { useUserProfile } from "@/hooks/useUserProfile";
import Link from "next/link";


export default function FoodImageClassifier() {
  const { file, preview, dataUri, error: fileError, handleFileChange, reset: resetFile, isProcessing: isFileProcessing } = useFileUpload();
  const [classificationResult, setClassificationResult] = useState<ClassifiedFoodItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile, isLoading: profileLoading } = useUserProfile();

  async function handleSubmit() {
    if (!dataUri) {
      toast({
        title: "Nenhuma Imagem",
        description: "Por favor, envie uma imagem de um alimento.",
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
    setClassificationResult(null);
    
    try {
      const input: ClassifyFoodItemFlowInput = { photoDataUri: dataUri, apiKey: profile.apiKey };
      const result: ClassifyFoodItemOutput = await classifyFoodItem(input);
      
      setClassificationResult(result.classifications);

      toast({
        title: "Classificação Concluída!",
        description: result.classifications.length > 0 ? "Itens alimentares identificados." : "Nenhum item alimentar pôde ser identificado com clareza.",
      });
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
      setApiError(`Falha ao classificar imagem. ${errorMessage}`);
      toast({
        title: "Erro na Classificação",
        description: "Não foi possível classificar a imagem. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const canSubmit = dataUri && !isLoading && !fileError && !isFileProcessing && profile?.apiKey && !profileLoading;

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Classificador de Imagens de Alimentos</CardTitle>
          <CardDescription>
            Envie uma foto de um alimento para obter uma classificação por IA. Requer uma Google API Key configurada em seu perfil.
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
              isProcessing={isFileProcessing || (isLoading && !apiError && !classificationResult)}
              reset={() => {
                resetFile();
                setClassificationResult(null);
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
            {isLoading ? <LoadingSpinner size="sm" text="Classificando..." /> : "Classificar Imagem do Alimento"}
          </Button>
        </CardFooter>
      </Card>

      {apiError && !(!profileLoading && !profile?.apiKey && apiError.includes("Google API Key não configurada")) && (
         <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Falha na Classificação</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {classificationResult && (
        <Card className="w-full max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SearchCheck className="w-6 h-6 text-primary" />
              <CardTitle className="font-headline text-xl">Resultados da Classificação</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {classificationResult.length > 0 ? (
              <ul className="space-y-2">
                {classificationResult.map((item, index) => (
                  <li key={index} className="flex justify-between items-center p-2 border-b last:border-b-0">
                    <span className="flex items-center gap-2">
                      <CheckCheck className="w-5 h-5 text-green-600" />
                      {item.label}
                    </span>
                    <Badge variant={item.confidence > 0.7 ? "default" : "secondary"}>
                      Confiança: {(item.confidence * 100).toFixed(0)}%
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center">Nenhum item alimentar pôde ser identificado com clareza na imagem.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

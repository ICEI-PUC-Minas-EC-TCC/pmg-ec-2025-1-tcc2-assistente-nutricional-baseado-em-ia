import type { AnalyzeNutritionFromPhotoOutput } from "@/ai/flows/analyze-nutrition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Leaf, Flame } from "lucide-react";

interface NutritionDisplayProps {
  analysis: AnalyzeNutritionFromPhotoOutput["nutritionalAnalysis"];
}

export default function NutritionDisplay({ analysis }: NutritionDisplayProps) {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <CardTitle className="font-headline text-2xl md:text-3xl">Análise Nutricional</CardTitle>
        </div>
        <CardDescription>
          Aqui está uma análise nutricional da refeição gerada por IA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Calorias Estimadas</p>
          <p className="text-4xl font-bold text-primary flex items-center justify-center gap-2">
             <Flame className="w-8 h-8" /> {analysis.calories.toLocaleString()}
          </p>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-lg mb-3 font-headline text-center md:text-left">Macronutrientes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Proteína</p>
              <p className="text-2xl font-semibold">{analysis.macronutrients.protein}g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Carboidratos</p>
              <p className="text-2xl font-semibold">{analysis.macronutrients.carbohydrates}g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gordura</p>
              <p className="text-2xl font-semibold">{analysis.macronutrients.fat}g</p>
            </div>
          </div>
        </div>

        <Separator />
        
        {analysis.micronutrients && analysis.micronutrients.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-3 font-headline text-center md:text-left">Micronutrientes</h3>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {analysis.micronutrients.map((micro, index) => (
                <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                  {micro.name}: {micro.amount} {micro.unit}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {analysis.ingredients && analysis.ingredients.length > 0 && (
          <div>
            <Separator className="my-6"/>
            <h3 className="font-semibold text-lg mb-3 font-headline text-center md:text-left flex items-center gap-2 justify-center md:justify-start">
              <Leaf className="w-5 h-5 text-green-600"/>Ingredientes Detectados
            </h3>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {analysis.ingredients.map((ingredient, index) => (
                <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                  {ingredient}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import type { GeneratePersonalizedRecipeOutput } from "@/ai/flows/personalized-recipe";
import type { GenerateRecipeFromPhotoOutput } from "@/ai/flows/generate-recipe";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Utensils } from "lucide-react";

type RecipeData = GeneratePersonalizedRecipeOutput | GenerateRecipeFromPhotoOutput;

interface RecipeDisplayProps {
  recipe: RecipeData;
}

export default function RecipeDisplay({ recipe }: RecipeDisplayProps) {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Utensils className="w-6 h-6 text-primary" />
          <CardTitle className="font-headline text-2xl md:text-3xl">{recipe.recipeName}</CardTitle>
        </div>
        {recipe.calorieEstimate && (
          <Badge variant="outline" className="w-fit text-sm">
            Calorias Estimadas: {typeof recipe.calorieEstimate === 'number' ? recipe.calorieEstimate.toLocaleString() : recipe.calorieEstimate}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-2 font-headline">Ingredientes:</h3>
          <ul className="list-none space-y-1 pl-0">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-1 shrink-0" />
                <span>{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2 font-headline">Instruções:</h3>
          <ol className="list-none space-y-3 pl-0">
            {recipe.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start">
                <Badge variant="secondary" className="mr-3 mt-0.5 shrink-0 font-bold">
                  {index + 1}
                </Badge>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
        {recipe.substitutionSuggestions && recipe.substitutionSuggestions.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-2 font-headline">Sugestões de Substituição:</h3>
            <ul className="list-none space-y-1 pl-0">
              {recipe.substitutionSuggestions.map((suggestion, index) => (
                 <li key={index} className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-accent mr-2 mt-1 shrink-0" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

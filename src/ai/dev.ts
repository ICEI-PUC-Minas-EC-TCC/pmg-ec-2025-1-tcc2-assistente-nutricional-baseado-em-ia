import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-nutrition.ts';
import '@/ai/flows/personalized-recipe.ts';
import '@/ai/flows/generate-recipe.ts';
import '@/ai/flows/nutrition-chat-flow.ts'; // Add new chat flow
import '@/ai/flows/classify-food-item-flow.ts';

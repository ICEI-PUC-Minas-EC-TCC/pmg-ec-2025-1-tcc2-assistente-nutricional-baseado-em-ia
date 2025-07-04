export interface UserProfile {
  name?: string;
  age?: number;
  weight?: number; // kg
  height?: number; // cm
  dietaryRestrictions?: string;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | '';
}

export interface ClassifiedFoodItem {
  label: string;
  confidence: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

import { apiClient } from './axios';

export interface PriceSuggestion {
  suggestedPrice: number;
  reasoning: string;
  priceRange: {
    min: number;
    max: number;
  };
}

export interface DescriptionSuggestion {
  description: string;
  highlights: string[];
}

export const suggestPrice = async (
  title: string,
  condition: string,
  category: string,
  currentDescription: string
): Promise<PriceSuggestion | null> => {
  try {
    const response = await apiClient.post<PriceSuggestion>('/ai/suggest-price', {
      title,
      condition,
      category,
      description: currentDescription,
    });

    return response.data;
  } catch (error) {
    console.error('[VertexAI] Price suggestion failed:', error);
    return null;
  }
};

export const suggestDescription = async (
  title: string,
  condition: string,
  category: string,
  currentDescription: string
): Promise<DescriptionSuggestion | null> => {
  try {
    const response = await apiClient.post<DescriptionSuggestion>('/ai/suggest-description', {
      title,
      condition,
      category,
      description: currentDescription,
    });

    return response.data;
  } catch (error) {
    console.error('[VertexAI] Description suggestion failed:', error);
    return null;
  }
};
export const suggestRiskAssessment = async (payload: any) => {
  const res = await apiClient.post('/ai/risk-assessment', payload);
  return res.data as { risks: string[] };
}

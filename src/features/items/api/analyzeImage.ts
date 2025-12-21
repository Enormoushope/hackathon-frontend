import { apiClient } from '../../../lib/axios';

export interface AnalyzeImageResponse {
  name?: string;
  title?: string;
  category?: string;
  conditionComment?: string;
  raw?: string;
}

export const analyzeImage = async (imageBase64: string, prompt?: string): Promise<AnalyzeImageResponse> => {
  const response = await apiClient.post<AnalyzeImageResponse>('/ai/analyze', {
    imageBase64,
    prompt,
  });
  return response.data;
};

import type { Item } from '../types';
import { apiClient } from '../../../lib/axios';

export const getItems = async (url?: string): Promise<Item[]> => {
  try {
    const endpoint = url || '/items';
    console.log('[getItems] Calling API endpoint:', endpoint);
    const response = await apiClient.get<Item[]>(endpoint);
    console.log('[getItems] API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch items:', error);
    return [];
  }
};

export const getItemById = async (id: string | undefined): Promise<Item | null> => {
  if (!id) return null;
  try {
    const response = await apiClient.get<Item>(`/items/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch item ${id}:`, error);
    return null;
  }
};

export const incrementItemViewCount = async (id: string): Promise<Item | null> => {
  try {
    const response = await apiClient.post<Item>(`/items/${id}/increment-view`);
    return response.data;
  } catch (error) {
    console.error(`Failed to increment view count for item ${id}:`, error);
    return null;
  }
};
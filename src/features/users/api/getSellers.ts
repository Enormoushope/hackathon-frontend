import type { Seller } from '../types';
import { apiClient } from '../../../lib/axios';

export const getSellers = async (): Promise<Seller[]> => {
  try {
    const response = await apiClient.get<Seller[]>('/users');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sellers:', error);
    return [];
  }
};

export const getSellerById = async (id: string | undefined): Promise<Seller | null> => {
  if (!id) return null;
  try {
    const response = await apiClient.get<Seller>(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch seller ${id}:`, error);
    return null;
  }
};

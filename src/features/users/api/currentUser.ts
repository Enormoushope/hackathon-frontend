import axios from 'axios';
import { apiClient } from '@/lib/axios';
import type { Seller } from '../types';

export interface UpsertUserPayload {
  name: string;
  avatarUrl?: string;
  bio?: string;
}

export const fetchCurrentUser = async (): Promise<Seller> => {
  try {
    const response = await apiClient.get<Seller>('/auth/me');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error;
    }
    throw new Error('Failed to fetch current user');
  }
};

export const upsertCurrentUser = async (payload: UpsertUserPayload): Promise<Seller> => {
  try {
    const response = await apiClient.post<Seller>('/auth/me', payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error;
    }
    throw new Error('Failed to create or update user');
  }
};

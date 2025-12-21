import axios from 'axios';
import { apiClient } from '@/lib/axios';
// import type { Seller } from '../types';

export interface UpsertUserPayload {
  username: string;
  avatarUrl?: string;
  bio?: string;
}


import type { Seller } from '../types';
const mapSeller = (user: any): Seller => ({
  id: user.id,
  username: user.username || user.name,
  avatarUrl: user.avatarUrl || user.avatar_url,
  bio: user.bio,
  rating: user.rating,
  sellingCount: user.sellingCount ?? user.listings_count,
  followerCount: user.followerCount ?? user.follower_count,
  reviewCount: user.reviewCount ?? user.review_count,
  transactionCount: user.transactionCount ?? user.transaction_count,
});

export const fetchCurrentUser = async (): Promise<Seller> => {
  try {
    const response = await apiClient.get<any>('/api/auth/me');
    return mapSeller(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error;
    }
    throw new Error('Failed to fetch current user');
  }
};


export const upsertCurrentUser = async (payload: UpsertUserPayload): Promise<Seller> => {
  try {
    const response = await apiClient.post<any>('/api/auth/me', payload);
    return mapSeller(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error;
    }
    throw new Error('Failed to create or update user');
  }
};

import type { Seller } from '../types';
import { apiClient } from '../../../lib/axios';


const mapSeller = (user: any): Seller => ({
  id: user.id,
  name: user.name || user.name || '',
  avatarUrl: user.avatarUrl || user.avatar_url,
  bio: user.bio,
  rating: user.rating,
  sellingCount: user.sellingCount ?? user.listings_count,
  followerCount: user.followerCount ?? user.follower_count,
  reviewCount: user.reviewCount ?? user.review_count,
  transactionCount: user.transactionCount ?? user.transaction_count,
});

export const getSellers = async (): Promise<Seller[]> => {
  try {
    const response = await apiClient.get<any[]>('/api/users');
    return response.data.map(mapSeller);
  } catch (error) {
    console.error('Failed to fetch sellers:', error);
    return [];
  }
};


export const getSellerById = async (id: string | undefined): Promise<Seller | null> => {
  if (!id) return null;
  try {
    const response = await apiClient.get<any>(`/api/users/${id}`);
    return mapSeller(response.data);
  } catch (error) {
    console.error(`Failed to fetch seller ${id}:`, error);
    return null;
  }
};

import { apiClient } from '@/lib/axios';
import type { ItemReaction } from '../types';

export const addReaction = async (
  itemId: string,
  userId: string,
  reactionType: 'like' | 'watch'
): Promise<ItemReaction | null> => {
  try {
    const response = await apiClient.post<ItemReaction>('/reactions', {
      itemId,
      userId,
      reactionType,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to add reaction:', error);
    return null;
  }
};

export const removeReaction = async (
  itemId: string,
  userId: string,
  reactionType: 'like' | 'watch'
): Promise<boolean> => {
  try {
    await apiClient.delete('/reactions', {
      data: {
        itemId,
        userId,
        reactionType,
      },
    });
    return true;
  } catch (error) {
    console.error('Failed to remove reaction:', error);
    return false;
  }
};

export const getItemReactions = async (
  itemId: string
): Promise<ItemReaction[]> => {
  try {
    const response = await apiClient.get<ItemReaction[]>(
      `/reactions/items/${itemId}`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get item reactions:', error);
    return [];
  }
};

export const getUserReactions = async (
  userId: string
): Promise<ItemReaction[]> => {
  try {
    const response = await apiClient.get<ItemReaction[]>(
      `/reactions/users/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get user reactions:', error);
    return [];
  }
};

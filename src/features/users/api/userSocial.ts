import { apiClient } from '@/lib/axios';

export interface UserFollow {
  id: string;
  followerId: string;
  followeeId: string;
  createdAt: string;
}

export interface UserReview {
  id: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const followUser = async (
  followerId: string,
  followeeId: string
): Promise<UserFollow | null> => {
  try {
    const response = await apiClient.post<UserFollow>('/follows', {
      followerId,
      followeeId,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to follow user:', error);
    return null;
  }
};

export const unfollowUser = async (
  followerId: string,
  followeeId: string
): Promise<boolean> => {
  try {
    await apiClient.delete('/follows', {
      data: {
        followerId,
        followeeId,
      },
    });
    return true;
  } catch (error) {
    console.error('Failed to unfollow user:', error);
    return false;
  }
};

export const getFollowers = async (
  userId: string
): Promise<UserFollow[]> => {
  try {
    console.log('[userSocial] Fetching followers for:', userId);
    const response = await apiClient.get<UserFollow[]>(
      `/follows/followers/${userId}`
    );
    console.log('[userSocial] Followers response:', response.data);
    return response.data || [];
  } catch (error) {
    console.error('[userSocial] Failed to get followers:', userId, error);
    return [];
  }
};

export const getFollowing = async (
  userId: string
): Promise<UserFollow[]> => {
  try {
    const response = await apiClient.get<UserFollow[]>(
      `/follows/following/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get following:', error);
    return [];
  }
};

export const createReview = async (
  reviewerId: string,
  revieweeId: string,
  rating: number,
  comment: string
): Promise<UserReview | null> => {
  try {
    const response = await apiClient.post<UserReview>('/reviews', {
      reviewerId,
      revieweeId,
      rating,
      comment,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to create review:', error);
    return null;
  }
};

export const getUserReviews = async (
  userId: string
): Promise<UserReview[]> => {
  try {
    const response = await apiClient.get<UserReview[]>(
      `/reviews/user/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get user reviews:', error);
    return [];
  }
};

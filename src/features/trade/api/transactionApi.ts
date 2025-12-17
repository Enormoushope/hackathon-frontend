import { apiClient } from '@/lib/axios';

export interface PriceHistoryPoint {
  id: string;
  itemId: string;
  price: number;
  recordedAt: string;
}

export const getPriceHistory = async (itemId: string): Promise<PriceHistoryPoint[]> => {
  try {
    const response = await apiClient.get<PriceHistoryPoint[]>(`/price-history/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch price history:', error);
    return [];
  }
};

export interface Transaction {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  quantity: number;
  transactionType: string;
  status: string;
  createdAt: string;
  itemTitle?: string;
  itemImageUrl?: string;
  buyerName?: string;
  sellerName?: string;
}

export const createTransaction = async (data: {
  itemId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  quantity?: number;
  transactionType: string;
}): Promise<Transaction | null> => {
  try {
    const response = await apiClient.post<Transaction>('/transactions', data);
    return response.data;
  } catch (error) {
    console.error('Failed to create transaction:', error);
    return null;
  }
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const response = await apiClient.get<Transaction[]>(`/transactions/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user transactions:', error);
    return [];
  }
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  try {
    const response = await apiClient.get<Transaction[]>('/transactions');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch all transactions:', error);
    return [];
  }
};

import { apiClient } from '@/lib/axios';

export interface PriceHistoryPoint {
  id: string;
  itemId: string;
  price: number;
  recordedAt: string;
}


const mapPriceHistory = (ph: any): PriceHistoryPoint => ({
  ...ph,
  itemId: ph.itemId || ph.item_id,
  recordedAt: ph.recordedAt || ph.recorded_at,
});

export const getPriceHistory = async (itemId: string): Promise<PriceHistoryPoint[]> => {
  try {
    const response = await apiClient.get<any[]>(`/price-history/${itemId}`);
    return response.data.map(mapPriceHistory);
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


const mapTransaction = (tx: any): Transaction => ({
  ...tx,
  itemId: tx.itemId || tx.item_id,
  buyerId: tx.buyerId || tx.buyer_id,
  sellerId: tx.sellerId || tx.seller_id,
  createdAt: tx.createdAt || tx.created_at,
});

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const response = await apiClient.get<any[]>(`/transactions/user/${userId}`);
    return response.data.map(mapTransaction);
  } catch (error) {
    console.error('Failed to fetch user transactions:', error);
    return [];
  }
};


export const getAllTransactions = async (): Promise<Transaction[]> => {
  try {
    const response = await apiClient.get<any[]>('/transactions');
    return response.data.map(mapTransaction);
  } catch (error) {
    console.error('Failed to fetch all transactions:', error);
    return [];
  }
};

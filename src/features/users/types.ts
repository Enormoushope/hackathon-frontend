export type Seller = {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  rating?: number; // 0-5
  sellingCount?: number;
  followerCount?: number;
  reviewCount?: number;
  transactionCount?: number;
};


export type Item = {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  imageUrls?: string[];
  isSoldOut: boolean;
  sellerId?: string;
  description?: string;
  category?: string;
  condition?: string;
  tags?: string[];
  // オプション: 資産 (投資) として扱うか
  isInvestItem?: boolean;
  viewCount?: number;
  likeCount?: number;
  watchCount?: number;
  sellerRating?: number;
  productGroup?: string; // 同種商品グループ識別子
};

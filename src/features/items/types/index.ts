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
  isInvestItem?: boolean;
  viewCount?: number;
  likeCount?: number;
  watchCount?: number;
  sellerRating?: number;
  productGroup?: string; // 同種商品グループ識別子
};

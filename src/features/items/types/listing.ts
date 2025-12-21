/**
 * 出品情報の型定義
 */

// 鑑定情報
export interface GradingInfo {
  grader: 'PSA' | 'BGS' | 'CGC' | 'none'; // 鑑定機関
  grade?: number; // グレード (1-10)
  certNumber?: string; // 証明番号
}

// 配送設定
export interface ShippingSettings {
  shippingPaidBy: 'seller' | 'buyer'; // 送料負担
  shippingMethod: 'anonymousCourier' | 'postalMail' | 'letterPack'; // 配送方法
  prefectureFrom: string; // 発送元都道府県
  daysToShip: '1-2' | '2-3' | '4-7'; // 発送までの日数
}

// 倉庫保管情報
export interface WarehouseStorage {
  enabled: boolean; // 倉庫保管を利用するか
  warehouseId?: string; // 倉庫ID
  estimatedValue?: number; // 推定資産価値
}

// 投資対象商品情報
export interface InvestmentAsset {
  isInvestment: boolean; // 投資対象フラグ
  gradingInfo?: GradingInfo; // 鑑定情報
  warehouseStorage?: WarehouseStorage; // 倉庫保管設定
  purchaseDate?: string; // 購入日
  originalPrice?: number; // 購入時定価
}

// 出品フォーム（フロントエンド用）
export interface ListingFormData {
  // 基本情報
  itemname: string; // 商品名 (40文字程度)
  description: string; // 商品説明 (1000文字程度)
  categoryId: string; // カテゴリID
  condition: 'new' | 'good' | 'fair' | 'poor'; // 商品状態

  // 画像
  images: File[]; // 画像ファイル配列

  // 価格
  price: number; // 出品価格

  // タグ
  tags?: string[]; // 任意タグ（最大10）

  // 配送
  shipping: ShippingSettings;

  // 投資・トレカ機能
  investment: InvestmentAsset;
}

// 出品API用データ（バックエンド送信用）
export interface ListingApiData {
  itemname: string;
  description: string;
  price: number;
  categoryId: string;
  condition: 'new' | 'good' | 'fair' | 'poor';
  imageUrls: string[];
  sellerId: string;
  isInvestItem: boolean;
  shipping: ShippingSettings;
  tags?: string[];
}

// 投資資産情報（バックエンド保存用）
export interface CreateInvestmentAssetRequest {
  itemId: string;
  grader: string;
  grade?: number;
  certNumber?: string;
  purchaseDate?: string;
  originalPrice?: number;
  estimatedValue?: number;
}

// 倉庫保管情報（バックエンド保存用）
export interface CreateWarehouseStorageRequest {
  itemId: string;
  warehouseId: string;
  estimatedValue: number;
}

// カテゴリマスタ
export interface Category {
  id: string;
  name: string;
  parentId?: string;
  children?: Category[];
}

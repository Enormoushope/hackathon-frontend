import { apiClient } from '../../../lib/axios';
import type { ListingFormData, CreateItemRequest, CreateInvestmentAssetRequest, CreateWarehouseStorageRequest } from '../types/listing';

/**
 * 商品を出品する
 */
export const createListing = async (formData: ListingFormData, sellerId: string) => {
  try {
    // 画像アップロード（ここではモック）
    const imageUrls = formData.images.map((_, idx) =>
      `https://placehold.jp/300x300.png?text=Image${idx + 1}`
    );

    const request: CreateItemRequest = {
      title: formData.title,
      description: formData.description,
      price: formData.price,
      categoryId: formData.categoryId,
      condition: formData.condition,
      imageUrls,
      sellerId,
      isInvestItem: formData.investment.isInvestment,
      shipping: formData.shipping,
      tags: (formData.tags || []).slice(0, 10),
    };

    const response = await apiClient.post('/items', request);
    const itemId = response.data.itemId;

    // 投資商品の場合は追加の登録を行う
    if (formData.investment.isInvestment && formData.investment.gradingInfo?.grader) {
      const investRequest: CreateInvestmentAssetRequest = {
        itemId,
        grader: formData.investment.gradingInfo.grader,
        grade: formData.investment.gradingInfo.grade,
        certNumber: formData.investment.gradingInfo.certNumber,
        purchaseDate: formData.investment.purchaseDate,
        originalPrice: formData.investment.originalPrice,
        estimatedValue: formData.investment.warehouseStorage?.estimatedValue,
      };
      await apiClient.post('/investment-assets', investRequest);
    }

    // 倉庫保管の場合
    if (formData.investment.warehouseStorage?.enabled && formData.investment.warehouseStorage?.warehouseId) {
      const storageRequest: CreateWarehouseStorageRequest = {
        itemId,
        warehouseId: formData.investment.warehouseStorage.warehouseId,
        estimatedValue: formData.investment.warehouseStorage.estimatedValue || 0,
      };
      await apiClient.post('/warehouse-storage', storageRequest);
    }

    return { success: true, itemId, data: response.data };
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
};

/**
 * 投資資産情報を取得
 */
export const getInvestmentAsset = async (itemId: string) => {
  try {
    const response = await apiClient.get(`/investment-assets/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching investment asset:', error);
    return null;
  }
};

/**
 * 倉庫保管情報を取得
 */
export const getWarehouseStorage = async (itemId: string) => {
  try {
    const response = await apiClient.get(`/warehouse-storage/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouse storage:', error);
    return null;
  }
};

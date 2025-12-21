import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { getItemById, incrementItemViewCount } from '@/features/items/api/getItems';
import type { Item } from '@/features/items/types';
import { getSellerById } from '@/features/users/api/getSellers';
import type { Seller } from '@/features/users/types';
import { createConversation } from '@/features/chat/api/chatApi';
import { apiClient } from '@/lib/axios';
import { suggestPrice, suggestRiskAssessment } from '@/lib/gemini';
import type { User as FirebaseUser } from 'firebase/auth';

type Verdict = 'high' | 'low' | 'fair';

export type PriceInsight = {
  verdict: Verdict;
  suggested: number;
  range: { min: number; max: number };
  reasoning: string;
};

export type RiskAxis = { label: string; score: number; hint?: string };

export type UsePurchaseItemState = {
  item: Item | null;
  seller: Seller | null;
  loading: boolean;
  isProcessing: boolean;
  showUserInfoForm: boolean;
  priceInsight: PriceInsight | null;
  insightLoading: boolean;
  riskAxes: RiskAxis[];
  riskOverall: number;
  aiRisks: string[];
  aiRiskLoading: boolean;
};

export type UsePurchaseItemHandlers = {
  handleStartChat: () => Promise<void>;
  handleBuy: (options?: { warehouse?: boolean }) => Promise<boolean>;
  handleUserInfoSubmit: (data: any) => Promise<void>;
  handleCheckAiRisk: () => Promise<void>;
  handleCheckPriceInsight: () => Promise<void>;
  closeUserInfoForm: () => void;
};

export type UsePurchaseItemResult = UsePurchaseItemState & UsePurchaseItemHandlers;

type RiskAssessmentResult = {
  riskScore?: number;
  reason?: string;
  flags?: string[];
  imageMismatch?: boolean;
  clarityScore?: number;
  clarityReason?: string;
  authenticityScore?: number;
  authenticityReason?: string;
  reconstructedDescription?: string;
  categoryFit?: string;
  categoryReason?: string;
};

export const usePurchaseItem = (
  itemId: string | undefined,
  navigate: NavigateFunction,
  user: FirebaseUser | null
): UsePurchaseItemResult => {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [showUserInfoForm, setShowUserInfoForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [priceInsight, setPriceInsight] = useState<PriceInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [riskAxes, setRiskAxes] = useState<RiskAxis[]>([]);
  const [riskOverall, setRiskOverall] = useState<number>(0);
  const [aiRisks, setAiRisks] = useState<string[]>([]);
  const [aiRiskLoading, setAiRiskLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const found = await getItemById(String(itemId));
        if (mounted) setItem(found);
        if (found?.id) {
          await incrementItemViewCount(found.id);
        }
        if (mounted && found?.sellerId) {
          const s = await getSellerById(found.sellerId);
          if (mounted) setSeller(s);
        } else if (mounted) {
          setSeller(null);
        }
      } catch (e) {
        if (mounted) setItem(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [itemId]);

  const inferCondition = useCallback((text: string) => {
    const s = text.toLowerCase();
    if (s.includes('新品') || s.includes('new')) return '新品・未使用';
    if (s.includes('美品') || s.includes('ほぼ未使用') || s.includes('mint')) return '目立った傷なし';
    if (s.includes('傷') || s.includes('使用感') || s.includes('used')) return '傷あり';
    return '目立った傷なし';
  }, []);

  const handleStartChat = useCallback(async () => {
    if (!item || !seller || !user) {
      alert('ログインが必要です');
      navigate('/login');
      return;
    }
    try {
      const conversation = await createConversation(item.id, user.uid, seller.id);
      if (conversation) {
        navigate(`/chat/${conversation.id}`);
      } else {
        alert('チャットの開始に失敗しました');
      }
    } catch (error) {
      console.error('[PurchaseItem] Error creating conversation:', error);
      alert('チャットの開始に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, [item, seller, user, navigate]);

  const handleBuy = useCallback(
    async (options?: { warehouse?: boolean }) => {
      if (!item) return false;
      if (item.isSoldOut) return false;
      if (!user) {
        alert('ログインが必要です');
        navigate('/login');
        return false;
      }
      setIsProcessing(true);
      try {
        const payload = {
          itemId: item.id,
          buyerId: user.uid,
          sellerId: item.sellerId,
          price: item.price,
          quantity: 1,
          transactionType: 'purchase',
          warehouse: options?.warehouse ?? false,
        };
        console.log('[handleBuy] POST payload:', payload);
        const response = await apiClient.post('/transactions/complete', payload);
        console.log('[handleBuy] Response:', response.data);
        setItem((prev) => (prev ? { ...prev, isSoldOut: true } : prev));
        alert('購入が完了しました。取引の評価をお願いします。');
        return true;
      } catch (error) {
        console.error('[PurchaseItem] Purchase failed:', error);
        alert('購入処理に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [item, navigate, user]
  );

  const handleUserInfoSubmit = useCallback(
    async (_data: unknown) => {
      // 互換用：フォーム経由でも最終的に handleBuy を呼び出す
      await handleBuy();
    },
    [handleBuy]
  );

  const handleCheckAiRisk = useCallback(async () => {
    if (!item) return;
    setAiRiskLoading(true);
    try {
      const payload = {
        name: item.name,
        category: item.category || (item.isInvestItem ? '投資商品' : '一般商品'),
        condition: item.condition || inferCondition(item.name + ' ' + (item.description || '')),
        description: (item.description || '').trim() || '説明なし',
        price: item.price,
        tags: item.tags || [],
        imageUrls: item.imageUrls || [item.imageUrl].filter(Boolean),
        imageDescription: '',
      };
      const res = (await suggestRiskAssessment(payload)) as RiskAssessmentResult;
      const collected: string[] = [];

      if (res.reason) collected.push(`総合: ${res.reason}`);
      if (typeof res.clarityScore === 'number') {
        collected.push(`商品明瞭性 ${res.clarityScore}: ${res.clarityReason || ''}`.trim());
      }
      if (typeof res.authenticityScore === 'number') {
        const recon = res.reconstructedDescription ? `| 再構成: ${res.reconstructedDescription}` : '';
        collected.push(`真正性 ${res.authenticityScore}: ${res.authenticityReason || ''} ${recon}`.trim());
      }
      if (res.categoryFit) {
        collected.push(`カテゴリ適合: ${res.categoryFit} (${res.categoryReason || ''})`.trim());
      }
      if (res.imageMismatch) {
        collected.push('画像と説明の不一致・不足の可能性');
      }
      if (res.flags && res.flags.length > 0) {
        collected.push(...res.flags);
      }
      if (collected.length === 0) collected.push('診断結果はありません');
      setAiRisks(collected);

      const axes: RiskAxis[] = [];
      if (typeof res.riskScore === 'number') {
        axes.push({ label: '総合リスク', score: Math.round(res.riskScore * 100), hint: res.reason || '' });
      }
      if (typeof res.clarityScore === 'number') {
        axes.push({ label: '商品明瞭性', score: res.clarityScore, hint: res.clarityReason });
      }
      if (typeof res.authenticityScore === 'number') {
        axes.push({ label: '真正性', score: res.authenticityScore, hint: res.authenticityReason });
      }
      if (res.categoryFit) {
        const categoryScore = res.categoryFit === 'mismatch' ? 80 : 20;
        axes.push({ label: 'カテゴリ適合', score: categoryScore, hint: res.categoryReason });
      }
      if (typeof res.imageMismatch === 'boolean') {
        axes.push({ label: '画像整合性', score: res.imageMismatch ? 85 : 15, hint: res.imageMismatch ? '画像と説明の不一致・不足' : '大きな不一致なし' });
      }
      setRiskAxes(axes);
      if (axes.length > 0) {
        const overall = Math.round(
          axes.reduce((acc, a) => acc + a.score, 0) / axes.length
        );
        setRiskOverall(overall);
      } else {
        setRiskOverall(0);
      }
    } catch (e) {
      console.error('AI risk assessment failed', e);
      setAiRisks([]);
      setRiskAxes([]);
      setRiskOverall(0);
      alert('AIリスク診断に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setAiRiskLoading(false);
    }
  }, [inferCondition, item]);

  const handleCheckPriceInsight = useCallback(async () => {
    if (!item) return;
    setInsightLoading(true);
    try {
      const name = item.name;
      const condition = inferCondition(item.name);
      const categoryLabel = item.isInvestItem ? '投資商品' : '一般商品';
      const description = '';
      const res = await suggestPrice(name, condition, categoryLabel, description);
      if (res) {
        const sug = res.suggestedPrice;
        const min = res.priceRange.min;
        const max = res.priceRange.max;
        const band = Math.max(0, Math.min(1, (sug || (min + max) / 2) / 100000));
        const tolerance = 0.08 + band * 0.04;
        const upper = Math.max(max, sug * (1 + tolerance));
        const lower = Math.min(min, sug * (1 - tolerance));
        let verdict: Verdict = 'fair';
        if (item.price > upper) verdict = 'high';
        else if (item.price < lower) verdict = 'low';
        setPriceInsight({ verdict, suggested: sug, range: { min, max }, reasoning: res.reasoning });
      } else {
        alert('価格インサイトの取得に失敗しました');
      }
    } catch (e) {
      alert('価格インサイトの取得に失敗しました');
    } finally {
      setInsightLoading(false);
    }
  }, [inferCondition, item, seller]);

  const closeUserInfoForm = useCallback(() => setShowUserInfoForm(false), []);

  return useMemo(
    () => ({
      item,
      seller,
      loading,
      isProcessing,
      showUserInfoForm,
      priceInsight,
      insightLoading,
      riskAxes,
      riskOverall,
      aiRisks,
      aiRiskLoading,
      handleStartChat,
      handleBuy,
      handleUserInfoSubmit,
      handleCheckAiRisk,
      handleCheckPriceInsight,
      closeUserInfoForm,
    }),
    [aiRiskLoading, aiRisks, closeUserInfoForm, handleBuy, handleCheckAiRisk, handleCheckPriceInsight, handleStartChat, handleUserInfoSubmit, insightLoading, isProcessing, item, loading, priceInsight, riskAxes, riskOverall, seller, showUserInfoForm]
  );
};

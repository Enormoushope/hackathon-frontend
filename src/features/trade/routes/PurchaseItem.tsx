import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { ReactionButtons } from '@/features/chat/components/ReactionButtons';
import { ItemDetailCard } from '@/features/trade/components/ItemDetailCard';
import { ItemSummaryCard } from '@/features/trade/components/ItemSummaryCard';
import { PriceInsightCard } from '@/features/trade/components/PriceInsightCard';
import { usePurchaseItem } from '@/features/trade/hooks/usePurchaseItem';
import { useAuth } from '@/hooks/useAuth';
import { UserInfoForm } from '@/features/users/components/UserInfoForm';
import { apiClient } from '@/lib/axios';

export const PurchaseItem = () => {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const { user } = useAuth();
  const [warehouseStorage, setWarehouseStorage] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const {
    item,
    seller,
    loading,
    isProcessing,
    showUserInfoForm,
    priceInsight,
    insightLoading,
    riskAxes,
    riskOverall,
    aiRiskLoading,
    handleStartChat,
    handleBuy,
    handleUserInfoSubmit,
    handleCheckAiRisk,
    handleCheckPriceInsight,
    closeUserInfoForm,
  } = usePurchaseItem(itemId, navigate, user);

  const submitReview = async () => {
    if (!user || !item?.sellerId) return;
    try {
      const payload = { reviewerId: user.uid, revieweeId: item.sellerId, rating: ratingValue };
      const res = await apiClient.post('/reviews', payload);
      if (res.status === 201 || res.status === 200) {
        alert('評価を送信しました。ありがとうございます！');
        setShowRatingForm(false);
        // 再取得して平均を反映
        //  sellerの再読込は必要に応じてページ遷移
        navigate(`/users/${user.uid}`);
      }
    } catch (e) {
      alert('評価の送信に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-500 font-bold">←</button>
        <h1 className="font-bold text-lg">購入手続き</h1>
        <div className="ml-3 text-sm text-gray-500">商品ID: {itemId ?? '—'}</div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {loading ? (
          <div className="p-6 text-center text-gray-500">読み込み中...</div>
        ) : !item ? (
          <div className="p-6 text-center text-gray-500">指定された商品は見つかりませんでした。</div>
        ) : (
          <>
            <ItemSummaryCard item={item} />
            <ItemDetailCard item={item} />

            {/* 価格インサイト + リスク診断 */}
            {item && (
              <PriceInsightCard
                priceInsight={priceInsight}
                riskAxes={riskAxes}
                riskOverall={riskOverall}
                insightLoading={insightLoading}
                aiRiskLoading={aiRiskLoading}
                onCheckPriceInsight={handleCheckPriceInsight}
                onCheckAiRisk={handleCheckAiRisk}
              />
            )}

            {/* いいね・注目ボタン */}
            {user && (
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <ReactionButtons itemId={item.id} userId={user.uid} />
              </div>
            )}

            {/* 投資商品タグ */}
            {item.isInvestItem && (
              <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">💎</span>
                  <span className="font-bold text-yellow-700">投資対象商品</span>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>この商品は投資対象として登録されています。</p>
                  <p>鑑定情報と価格推移をご確認の上、ご購入ください。</p>
                </div>
              </div>
            )}

            {/* 出品者情報 */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                <img src={seller?.avatarUrl ?? `https://i.pravatar.cc/150?u=${item.sellerId ?? 'seller'}`} alt="seller" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">出品者: {seller ? seller.name : (item.sellerId ? `User ${item.sellerId}` : '不明')}</div>
                    <div className="text-xs text-gray-500">
                      評価: ★{typeof seller?.rating === 'number' ? seller!.rating!.toFixed(1) : '—'}
                      {typeof seller?.transactionCount === 'number' ? ` (${seller!.transactionCount})` : ''}
                      
                      ・ 出品数 {seller?.sellingCount ?? '—'}
                    </div>
                  </div>
                  <a href={`/users/${item.sellerId}`} className="text-sm text-indigo-600">出品者ページ</a>
                </div>
                <div className="mt-2 text-xs text-gray-600">即日対応：発送は通常2-4営業日以内</div>
              </div>
            </div>

            {!item.isInvestItem && (
              <>
                {/* 配送予定・送料 */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <h3 className="font-bold mb-2">発送予定</h3>
                  <div className="text-sm text-gray-700">発送方法: 宅急便（追跡あり）</div>
                  <div className="text-sm text-gray-700">発送目安: 注文確定後2〜4営業日</div>
                  <div className="text-sm text-gray-700">送料: {item.price > 50000 ? '送料無料' : '全国一律 ¥880'}</div>
                </div>

                {/* 返品ポリシー */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <h3 className="font-bold mb-2">返品ポリシー</h3>
                  <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                    <li>商品到着後7日以内であれば返品を受付（未使用・付属品揃いの場合）</li>
                    <li>返送料は原則購入者負担。ただし、初期不良の場合は出品者負担</li>
                    <li>返金は商品の状態確認後に行います（7〜14営業日程度）</li>
                  </ul>
                </div>

                {/* 支払い方法選択 */}
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                  <h3 className="font-bold border-b pb-2">支払い方法</h3>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="payment" defaultChecked />
                      <span>💳 クレジットカード</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="payment" />
                      <span>🏪 コンビニ払い</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 bg-indigo-50 border-indigo-200">
                      <input type="radio" name="payment" />
                      <span className="font-bold text-indigo-700">💎 ETH決済 (Wallet)</span>
                    </label>
                  </div>
                </div>

                {/* 配送先 */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">配送先</h3>
                    <button className="text-blue-500 text-sm">変更</button>
                  </div>
                  <p className="text-sm text-gray-600">
                    〒100-0001<br/>
                    東京都千代田区千代田1-1<br/>
                    ハッカソン太郎 様
                  </p>
                </div>
              </>
            )}

            {/* 倉庫保管オプション */}
            <div className={`bg-white p-4 rounded-xl shadow-sm border-2 ${item.isInvestItem ? 'border-yellow-400' : 'border-blue-300'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  className={`w-5 h-5 ${item.isInvestItem ? 'text-yellow-500' : 'text-blue-500'}`}
                  checked={warehouseStorage}
                  onChange={(e) => setWarehouseStorage(e.target.checked)}
                />
                <div>
                  <span className="font-bold block">倉庫で保管する</span>
                  <span className="text-xs text-gray-500">
                    {item.isInvestItem 
                      ? '資産として保有し、後で再出品できます。配送はされません。'
                      : '商品を自分の倉庫に保管し、後で再出品できます。配送はされません。'
                    }
                  </span>
                </div>
              </label>
            </div>
          </>
        )}
      </main>

      {/* 固定フッター */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-area-bottom">
        <div className="max-w-md mx-auto flex gap-2">
          {item?.isInvestItem ? (
            <button 
              onClick={() => {
                if (warehouseStorage) {
                  void handleBuy({ warehouse: true });
                }
              }}
              disabled={isProcessing || !warehouseStorage || (item ? item.isSoldOut : true)}
              className="flex-1 bg-yellow-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-yellow-600 transition disabled:bg-gray-400"
            >
              {isProcessing ? '処理中...' : (item?.isSoldOut ? 'SOLD' : '倉庫に保管する')}
            </button>
          ) : (
            <>
              <button
                onClick={handleStartChat}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-700 transition"
              >
                💬 値段交渉
              </button>
              <button 
                onClick={async () => {
                  const ok = await handleBuy(warehouseStorage ? { warehouse: true } : undefined);
                  if (ok) setShowRatingForm(true);
                }}
                disabled={isProcessing || (item ? item.isSoldOut : true)}
                className="flex-1 bg-red-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-red-600 transition disabled:bg-gray-400"
              >
                {isProcessing ? '処理中...' : (item?.isSoldOut ? 'SOLD' : warehouseStorage ? '倉庫に保管する' : '購入する')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 個人情報入力フォーム（通常商品） */}
      {showUserInfoForm && !item?.isInvestItem && (
        <UserInfoForm
          title="購入手続き - 個人情報入力"
          description="商品の購入および配送のため、以下の情報を入力してください。"
          submitButtonText="購入を確定する"
          onSubmit={handleUserInfoSubmit}
          onCancel={closeUserInfoForm}
        />
      )}
      
      {/* 倉庫保管フォーム（投資商品） */}
      {showUserInfoForm && item?.isInvestItem && (
        <UserInfoForm
          title="倉庫保管 - 個人情報入力"
          description="倉庫保管のため、以下の情報を入力してください。"
          submitButtonText="倉庫に保管する"
          onSubmit={handleUserInfoSubmit}
          onCancel={closeUserInfoForm}
        />
      )}
      {/* 購入後の評価フォーム */}
      {showRatingForm && user && item?.sellerId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 w-[92%] max-w-md shadow-xl">
            <h3 className="font-bold mb-2">取引の評価をお願いします</h3>
            <div className="flex gap-2 mb-3">
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => setRatingValue(star)} className={star <= ratingValue ? 'text-yellow-500 text-xl' : 'text-gray-300 text-xl'}>
                  ★
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">{ratingValue} / 5</span>
            </div>
            <div className="flex gap-2">
              <button onClick={submitReview} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded font-bold">送信</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
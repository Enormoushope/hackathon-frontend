import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Item } from '../../items/types';
import { getItemById, incrementItemViewCount, getItems } from '../../items/api/getItems';
import type { Seller } from '../../users/types';
import { getSellerById } from '../../users/api/getSellers';
import { createConversation } from '@/features/chat/api/chatApi';
import { getPriceHistory, type PriceHistoryPoint } from '../api/transactionApi';

export const TradeDashboard = () => {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [relatedItems, setRelatedItems] = useState<Item[]>([]);
  const currentUserId = '101'; // TODO: Get from auth context

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // If itemId is "demo", redirect to first investment item
        if (itemId === 'demo') {
          const allItems = await getItems();
          const investItems = allItems.filter(item => item.isInvestItem);
          if (investItems.length > 0) {
            navigate(`/trade/${investItems[0].id}`, { replace: true });
            return;
          }
        }
        
        const found = await getItemById(String(itemId));
        if (mounted) setItem(found);
        
        // Increment view count once when item is loaded
        if (found && found.id) {
          await incrementItemViewCount(found.id);
        }
        
        if (mounted && found && found.sellerId) {
          const s = await getSellerById(found.sellerId);
          if (mounted) setSeller(s);
        }
        // Load price history
        if (mounted && itemId) {
          const history = await getPriceHistory(String(itemId));
          if (mounted) setPriceHistory(history);
        }
        // Load related items in same product group
        if (mounted && found && found.productGroup) {
          const allItems = await getItems();
          const related = allItems.filter(i => 
            i.productGroup === found.productGroup && i.id !== found.id
          );
          if (mounted) setRelatedItems(related);
        }
      } catch (e) {
        if (mounted) setItem(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [itemId, navigate]);

  // Format price history for chart (sorted by recordedAt)
  const sortedHistory = [...priceHistory].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const chartData = sortedHistory.map((ph) => {
    const date = new Date(ph.recordedAt);
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      price: ph.price,
    };
  });

  const hasTrend = chartData.length > 1;
  const lastUpdated = sortedHistory.length
    ? new Date(sortedHistory[sortedHistory.length - 1].recordedAt).toLocaleString('ja-JP')
    : null;

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : (item?.price || 0);

  const handleStartChat = async () => {
    if (!item || !seller) return;
    
    const conversation = await createConversation(
      item.id,
      currentUserId,
      seller.id
    );
    
    if (conversation) {
      navigate(`/chat/${conversation.id}`);
    } else {
      alert('チャットの開始に失敗しました');
    }
  };

  const handleBuy = () => {
    if (!item) return;
    setIsProcessing(true);
    setTimeout(() => {
      alert('購入申し込みが完了しました。チャットで出品者と連絡を取ってください。');
      setIsProcessing(false);
    }, 1500);
  };

  if (loading) {
    return <div className="p-6 text-center">読み込み中...</div>;
  }

  if (!item || !item.isInvestItem) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-4">この商品はトレード対象商品ではありません</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          ホームに戻る
        </button>
      </div>
    );
  }

  if (priceHistory.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-4">取引履歴データがありません</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          ホームに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      {/* ヘッダー */}
      <header className="border-b border-gray-700 p-4 flex justify-between items-center bg-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">← 戻る</button>
          <h1 className="text-xl font-bold line-clamp-1">{item.title}</h1>
          <span className="bg-blue-600 text-xs px-2 py-1 rounded">倉庫保管・所有権取引</span>
        </div>
        <div className="text-2xl font-bold text-green-400">
          ¥{item.price ? item.price.toLocaleString() : "0"} 
          <span className="text-sm text-gray-400 ml-2">+{(Math.random() * 20).toFixed(1)}%</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-64px)]">
        
        {/* 左カラム: チャート */}
        <div className="lg:col-span-2 p-6 border-r border-gray-700 flex flex-col">
          
          {/* 価格表示 */}
          <div className="flex gap-2 mb-6 items-center">
            <div className="ml-auto text-2xl font-bold text-green-400">
              ¥{currentPrice ? currentPrice.toLocaleString() : "0"}
            </div>
          </div>
          
          {/* 同種商品グループ表示 */}
          {item.productGroup && (
            <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
              <p className="text-xs text-blue-300 mb-2">
                📊 同種商品グループ: <span className="font-bold">{item.productGroup}</span>
              </p>
              {relatedItems.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {relatedItems.map(related => (
                    <button
                      key={related.id}
                      onClick={() => navigate(`/trade/${related.id}`)}
                      className="flex-shrink-0 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs border border-gray-600"
                    >
                      <div className="text-white font-semibold truncate w-32">{related.title}</div>
                      <div className="text-green-400">¥{related.price ? related.price.toLocaleString() : "0"}</div>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                ※ このグラフは同種商品全体の価格推移を表示しています
              </p>
            </div>
          )}

          {/* メインチャート */}
          <div className="flex-1 min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" tickFormatter={(val) => `¥${val/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                  itemStyle={{ color: '#E5E7EB' }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  name="取引価格"
                  stroke="#10B981"
                  strokeWidth={hasTrend ? 2 : 0}
                  dot={{ r: 5, fill: '#10B981', stroke: '#0f766e', strokeWidth: 2 }}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-xs text-gray-500 flex gap-4 items-center">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> 取引価格</span>
            {lastUpdated && <span>最終更新: {lastUpdated}</span>}
            {!hasTrend && <span className="text-yellow-400">※ 1件のみのため点表示</span>}
          </div>
        </div>

        {/* 右カラム: 取引パネル & 出品者情報 */}
        <div className="bg-gray-800 p-4 flex flex-col gap-4">
          {/* 出品者情報 */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-3">出品者</p>
            <div className="flex items-center gap-3 mb-4">
              <img src={seller?.avatarUrl ?? `https://i.pravatar.cc/150?u=${item.sellerId ?? 'seller'}`} alt="seller" className="w-10 h-10 rounded-full" />
              <div>
                <p className="font-bold text-sm">{seller?.name ?? '不明'}</p>
                <p className="text-xs text-gray-400">⭐ {seller?.rating?.toFixed(1) || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-300">
                <span>出品数</span>
                <span className="font-bold">{seller?.sellingCount || 0}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>フォロワー</span>
                <span className="font-bold">{seller?.followerCount || 0}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>取引閲覧</span>
                <span className="font-bold">{item.viewCount || 0}</span>
              </div>
            </div>
          </div>

          {/* 統計 */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center py-2 bg-gray-800 rounded">
                <p className="text-gray-400">いいね</p>
                <p className="text-xl font-bold text-red-500">{item.likeCount || 0}</p>
              </div>
              <div className="text-center py-2 bg-gray-800 rounded">
                <p className="text-gray-400">閲覧</p>
                <p className="text-xl font-bold text-blue-500">{item.viewCount || 0}</p>
              </div>
            </div>
          </div>

          {/* アクション */}
          <div className="space-y-2 mt-auto">
            {!item.isSoldOut ? (
              <>
                <button
                  onClick={handleBuy}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold text-sm disabled:opacity-50 transition"
                >
                  {isProcessing ? '処理中...' : '購入申し込む'}
                </button>
                <button
                  onClick={handleStartChat}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-sm transition"
                >
                  質問する
                </button>
              </>
            ) : (
              <div className="w-full bg-gray-600 text-gray-300 py-3 rounded-lg font-bold text-sm text-center">
                販売済み
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeDashboard;
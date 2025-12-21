import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { apiClient } from '../../../lib/axios';
import type { Item } from '../../items/types';
import type { Seller } from '../../users/types';

export const AdminItemDetail = () => {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const { isAdmin } = useAuth();
  
  const [item, setItem] = useState<Item | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin');
      return;
    }

    const loadItem = async () => {
      try {
        if (!itemId) {
          setError('商品IDが指定されていません');
          return;
        }

        // 商品情報を取得
        const itemRes = await apiClient.get(`/items/${itemId}`);
        setItem(itemRes.data);

        // 出品者情報を取得
        if (itemRes.data.sellerId) {
          try {
            const sellerRes = await apiClient.get(`/users/${itemRes.data.sellerId}`);
            setSeller(sellerRes.data);
          } catch (err) {
            console.error('Failed to fetch seller:', err);
          }
        }
      } catch (err) {
        setError('商品情報の取得に失敗しました');
        console.error('Failed to fetch item:', err);
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [itemId, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">エラーが発生しました</h1>
          <p className="text-gray-600 mb-6">{error || '商品が見つかりません'}</p>
          <button
            onClick={() => navigate('/admin')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            管理者画面に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/admin')}
            className="text-gray-600 hover:text-gray-800 font-bold text-sm flex items-center gap-2"
          >
            ← 管理者画面に戻る
          </button>
          <h1 className="text-xl font-bold text-gray-800">商品詳細（管理者画面）</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 画像 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-96 object-cover"
            />
            <div className="p-4 bg-gray-100">
              <p className="text-sm text-gray-600 font-mono break-all">ID: {item.id}</p>
            </div>
          </div>

          {/* 詳細情報 */}
          <div className="space-y-6">
            {/* 商品情報 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-3xl font-bold mb-4">{item.name}</h2>

              <div className="space-y-4 mb-6 border-b border-gray-200 pb-6">
                <div>
                  <p className="text-gray-600 text-sm">価格</p>
                  <p className="text-4xl font-black text-red-600">¥{item.price.toLocaleString()}</p>
                </div>

                <div className="flex gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">商品タイプ</p>
                    <p className="text-lg font-bold">
                      {(item as any).isInvestItem ? '📈 投資商品' : '🛒 通常商品'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">ステータス</p>
                    <p className={`text-lg font-bold ${item.isSoldOut ? 'text-gray-400' : 'text-green-600'}`}>
                      {item.isSoldOut ? '❌ 売却済み' : '✅ 販売中'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 統計 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm">閲覧数</p>
                  <p className="text-2xl font-bold text-blue-600">{(item as any).viewCount || 0}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm">いいね数</p>
                  <p className="text-2xl font-bold text-red-600">{(item as any).likeCount || 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm">登録ID</p>
                  <p className="text-lg font-bold text-purple-600 truncate">{item.sellerId}</p>
                </div>
              </div>
            </div>

            {/* 出品者情報 */}
            {seller && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">出品者情報</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
                    <img
                      src={`https://i.pravatar.cc/150?u=${seller.id}`}
                      alt={seller.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{seller.name}</p>
                    <p className="text-gray-600 text-sm font-mono">{seller.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-gray-600 text-xs">評価</p>
                    <p className="text-xl font-bold text-yellow-600">⭐ {seller.rating?.toFixed(1) || 'N/A'}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-gray-600 text-xs">出品数</p>
                    <p className="text-xl font-bold text-blue-600">{seller.sellingCount || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-gray-600 text-xs">フォロワー</p>
                    <p className="text-xl font-bold text-purple-600">{seller.followerCount || 0}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-gray-600 text-xs">レビュー数</p>
                    <p className="text-xl font-bold text-green-600">{seller.reviewCount || 0}</p>
                  </div>
                </div>

                {seller.bio && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-gray-600 text-sm mb-2">自己紹介</p>
                    <p className="text-gray-800">{seller.bio}</p>
                  </div>
                )}
              </div>
            )}

            {/* アクション */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">管理アクション</h3>
              <div className="space-y-3">
                <button
                  className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50"
                  disabled={item.isSoldOut}
                >
                  🚫 この商品を非表示にする
                </button>
                <button
                  className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-orange-700 transition"
                >
                  ⚠️ 違反報告を確認
                </button>
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-gray-700 transition"
                >
                  ← 戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

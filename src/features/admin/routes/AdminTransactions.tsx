import { useState, useEffect } from 'react';
import { getAllTransactions, type Transaction } from '@/features/trade/api/transactionApi';
import { Link } from 'react-router-dom';

export const AdminTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAllTransactions();
        if (mounted) setTransactions(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.price * tx.quantity, 0);
  const completedCount = transactions.filter((tx) => tx.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">全取引履歴（管理者）</h1>
          <p className="text-gray-600">プラットフォーム上のすべての取引を確認できます</p>
        </div>

        {/* 統計 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">総取引数</div>
            <div className="text-3xl font-bold text-gray-900">{transactions.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">完了した取引</div>
            <div className="text-3xl font-bold text-green-600">{completedCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">総取引額</div>
            <div className="text-3xl font-bold text-blue-600">¥{totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-600">まだ取引履歴がありません</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    取引ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    購入者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    販売者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    価格
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    数量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日時
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedTx(tx)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                      {tx.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {tx.itemImageUrl && (
                          <img
                            src={tx.itemImageUrl}
                            alt={tx.itemTitle}
                            className="w-10 h-10 rounded object-cover mr-2"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {tx.itemTitle || 'Unknown Item'}
                          </div>
                          <div className="text-xs text-gray-500">{tx.itemId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tx.buyerName || tx.buyerId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tx.sellerName || tx.sellerId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ¥{tx.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {tx.status === 'completed' ? '完了' : tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedTx && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-gray-500">取引ID</div>
                  <div className="font-mono text-sm text-gray-900">{selectedTx.id}</div>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="text-sm text-gray-500 hover:text-gray-800"
                >
                  閉じる ✕
                </button>
              </div>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700">
                <div>
                  <dt className="text-gray-500">商品</dt>
                  <dd className="font-semibold">{selectedTx.itemTitle || selectedTx.itemId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">購入者</dt>
                  <dd>{selectedTx.buyerName || selectedTx.buyerId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">販売者</dt>
                  <dd>{selectedTx.sellerName || selectedTx.sellerId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">価格</dt>
                  <dd className="font-semibold">¥{selectedTx.price.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">数量</dt>
                  <dd>{selectedTx.quantity}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">種別</dt>
                  <dd>{selectedTx.transactionType}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">ステータス</dt>
                  <dd>{selectedTx.status}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">日時</dt>
                  <dd>{new Date(selectedTx.createdAt).toLocaleString('ja-JP')}</dd>
                </div>
              </dl>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col gap-3">
              <div className="text-sm text-gray-600">関連アクション</div>
              <Link
                to={`/purchase/${selectedTx.itemId}`}
                className="text-blue-600 hover:underline text-sm"
              >
                商品詳細を見る
              </Link>
              <Link
                to={`/users/${selectedTx.buyerId}`}
                className="text-blue-600 hover:underline text-sm"
              >
                購入者プロフィール
              </Link>
              <Link
                to={`/users/${selectedTx.sellerId}`}
                className="text-blue-600 hover:underline text-sm"
              >
                販売者プロフィール
              </Link>
            </div>
          </div>
        )}

        <div className="mt-6">
          <Link
            to="/admin"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            ← 管理者ダッシュボードに戻る
          </Link>
        </div>
      </div>
    </div>
  );
};

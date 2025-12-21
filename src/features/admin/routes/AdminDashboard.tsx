import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { apiClient } from '../../../lib/axios';

export const AdminDashboard = () => {
  const { user, logOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'items' | 'reports' | 'engagement'>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalItems: 0,
    totalSales: 0,
    activeReports: 0,
  });
  const [reports, setReports] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [follows, setFollows] = useState<{ followerId: string; followingId: string }[]>([]);
  const [userRatings, setUserRatings] = useState<Map<string, number>>(new Map());
  const [userFollowerCounts, setUserFollowerCounts] = useState<Map<string, number>>(new Map());
  const [userTransactionCounts, setUserTransactionCounts] = useState<Map<string, number>>(new Map());

  // 統計情報を取得
  const fetchStats = async () => {
    try {
      const [usersRes, itemsRes, txRes] = await Promise.all([
        apiClient.get('/users').catch(err => {
          console.error('Failed to fetch users:', err);
          return { data: [] };
        }),
        apiClient.get('/items').catch(err => {
          console.error('Failed to fetch items:', err);
          return { data: [] };
        }),
        apiClient.get('/transactions').catch(err => {
          console.error('Failed to fetch transactions:', err);
          return { data: [] };
        }),
      ]);
      setStats({
        totalUsers: Array.isArray(usersRes.data) ? usersRes.data.length : 0,
        totalItems: Array.isArray(itemsRes.data) ? itemsRes.data.length : 0,
        totalSales: Array.isArray(txRes.data) ? txRes.data.length : 0,
        activeReports: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // ユーザー一覧を取得し、各ユーザーの☆・フォロワー数を動的に計算
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/users');
      const userData = Array.isArray(response.data) ? response.data : [];
      setUsers(userData);

      // ユーザーごとの☆とフォロワー数を計算（取引数0なら☆は非表示）
      const ratingMap = new Map<string, number>();
      const followerMap = new Map<string, number>();
      const transactionMap = new Map<string, number>();

      for (const user of userData) {
        // 取引数を取得
        try {
          const txRes = await apiClient.get(`/transactions/user/${user.id}`).catch(() => ({ data: [] }));
          const userTransactions = Array.isArray(txRes.data) ? txRes.data : [];
          transactionMap.set(user.id, userTransactions.length);

          // 取引がある場合のみレビューを取得・計算
          if (userTransactions.length > 0) {
            const revRes = await apiClient.get(`/reviews/user/${user.id}`).catch(() => ({ data: [] }));
            const userReviews = Array.isArray(revRes.data) ? revRes.data : [];
            if (userReviews.length > 0) {
              const avgRating = userReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / userReviews.length;
              ratingMap.set(user.id, avgRating);
            }
          }
        } catch {}

        // フォロワー取得
        try {
          const followerRes = await apiClient.get(`/follows/followers/${user.id}`).catch(() => ({ data: { followers: [] } }));
          const followers = followerRes.data?.followers ? followerRes.data.followers : [];
          if (Array.isArray(followers)) {
            followerMap.set(user.id, followers.length);
          }
        } catch {}
      }

      setUserRatings(ratingMap);
      setUserFollowerCounts(followerMap);
      setUserTransactionCounts(transactionMap);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // 商品一覧を取得
  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/items');
      const itemsData = Array.isArray(response.data) ? response.data : [];
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  // 通報一覧を取得
  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/reports');
      const reportsData = Array.isArray(response.data) ? response.data : [];
      setReports(reportsData);
      setStats(prev => ({ ...prev, activeReports: reportsData.length }));
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'items') {
      fetchItems();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'engagement') {
      (async () => {
        setLoading(true);
        try {
          // 全取引を取得
          const txRes = await apiClient.get('/transactions').catch(() => ({ data: [] }));
          const txs = Array.isArray(txRes.data) ? txRes.data : [];
          setTransactions(txs);

          // 全レビューを取得
          let allReviews: any[] = [];
          const usersRes = await apiClient.get('/users').catch(() => ({ data: [] }));
          const userIds = Array.isArray(usersRes.data) ? usersRes.data.map((u: any) => u.id) : [];
          
          for (const userId of userIds) {
            try {
              const revRes = await apiClient.get(`/reviews/user/${userId}`).catch(() => ({ data: [] }));
              if (Array.isArray(revRes.data)) {
                allReviews.push(...revRes.data);
              }
            } catch {}
          }
          setReviews(allReviews);

          // 全フォロー関係を取得
          let allFollows: any[] = [];
          for (const userId of userIds) {
            try {
              const followerRes = await apiClient.get(`/follows/followers/${userId}`).catch(() => ({ data: { followers: [] } }));
              const followers = followerRes.data?.followers ? followerRes.data.followers : [];
              if (Array.isArray(followers)) {
                allFollows.push(...followers.map((f: any) => ({ 
                  followerId: f.follower_id || f.followerId, 
                  followingId: f.followee_id || f.followeeId || userId 
                })));
              }
            } catch (err) {
              console.error(`Failed to fetch followers for user ${userId}:`, err);
            }
          }
          console.log('All follows:', allFollows);
          setFollows(allFollows);
        } catch (e) {
          console.error('Error fetching engagement data:', e);
          setTransactions([]);
          setReviews([]);
          setFollows([]);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🔐</div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">管理者ダッシュボード</h1>
              <p className="text-xs text-gray-300">Administrator Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold">{user?.email}</div>
              <div className="text-xs text-yellow-400 flex items-center justify-end gap-1">
                <span>⭐</span> 管理者権限
              </div>
            </div>
            <Link
              to="/"
              className="px-5 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-bold hover:bg-gray-100 transition shadow-lg"
            >
              ホームへ
            </Link>
            <button
              onClick={logOut}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold transition shadow-lg"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 統計カード */}
        {activeTab === 'overview' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">📊 システム概要</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="text-gray-500 text-sm font-semibold">総ユーザー数</div>
                  <div className="text-3xl font-black text-blue-600">{stats.totalUsers}</div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="text-3xl mb-2">📦</div>
                  <div className="text-gray-500 text-sm font-semibold">出品中の商品</div>
                  <div className="text-3xl font-black text-green-600">{stats.totalItems}</div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-gray-500 text-sm font-semibold">総取引数</div>
                  <div className="text-3xl font-black text-purple-600">{stats.totalSales}</div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="text-3xl mb-2">⚠️</div>
                  <div className="text-gray-500 text-sm font-semibold">未対応の通報</div>
                  <div className="text-3xl font-black text-red-600">{stats.activeReports}</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl mb-8">
              <h3 className="text-2xl font-bold mb-3">🎯 管理者パネルへようこそ</h3>
              <p className="text-indigo-100 mb-4">
                このパネルでは、ユーザー管理、商品管理、通報対応などの管理者機能を利用できます。
                各タブから必要な操作を行ってください。
              </p>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setActiveTab('users')}
                  className="px-4 py-2 bg-white text-indigo-700 rounded-lg font-bold hover:bg-indigo-50 transition"
                >
                  ユーザー管理 →
                </button>
                <button
                  onClick={() => setActiveTab('items')}
                  className="px-4 py-2 bg-white text-indigo-700 rounded-lg font-bold hover:bg-indigo-50 transition"
                >
                  商品管理 →
                </button>
                <Link
                  to="/admin/transactions"
                  className="px-4 py-2 bg-yellow-300 text-gray-900 rounded-lg font-bold hover:bg-yellow-200 transition"
                >
                  取引履歴を見る →
                </Link>
              </div>
            </div>
          </>
        )}

        {/* タブナビゲーション */}
        <div className="flex gap-2 mb-8 bg-white rounded-xl shadow-lg p-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-3 rounded-lg font-bold transition ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            📊 概要
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-4 py-3 rounded-lg font-bold transition ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            👥 ユーザー
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 px-4 py-3 rounded-lg font-bold transition ${
              activeTab === 'items'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            📦 商品
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 px-4 py-3 rounded-lg font-bold transition ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            ⚠️ 通報
          </button>
          <button
            onClick={() => setActiveTab('engagement')}
            className={`flex-1 px-4 py-3 rounded-lg font-bold transition ${
              activeTab === 'engagement'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            ⭐ エンゲージメント
          </button>
        </div>
        {/* エンゲージメントタブ（全取引・☆・フォロー関係） */}
        {activeTab === 'engagement' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-4xl">⭐</span>
              エンゲージメント（全体）
            </h2>

            {loading ? (
              <div className="text-center text-gray-500 py-12">読み込み中...</div>
            ) : (
              <>
                {/* ☆付き取引一覧：取引とレビューを結合表示 */}
                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3">☆付き取引
                    <span className="ml-2 text-xs text-gray-500">全取引 {transactions.length}件、レビュー {reviews.length}件</span>
                  </h3>
                  {transactions.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">取引がありません</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-3 py-2 text-left text-xs font-bold">取引ID</th>
                            <th className="px-3 py-2 text-left text-xs font-bold">商品</th>
                            <th className="px-3 py-2 text-left text-xs font-bold">購入者</th>
                            <th className="px-3 py-2 text-left text-xs font-bold">販売者</th>
                            <th className="px-3 py-2 text-left text-xs font-bold">価格</th>
                            <th className="px-3 py-2 text-left text-xs font-bold">ステータス</th>
                            <th className="px-3 py-2 text-left text-xs font-bold">☆評価</th>
                            <th className="px-3 py-2 text-left text-xs font-bold">コメント</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx: any) => {
                            // この取引に対応するレビューを探す
                            const matchingReview = reviews.find((r: any) => 
                              r.itemId === tx.itemId || r.transactionId === tx.id || 
                              (r.reviewedUserId === tx.sellerId && r.reviewerId === tx.buyerId)
                            );
                            return (
                              <tr key={tx.id} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-2 text-xs font-mono text-gray-600">{tx.id?.substring(0, 8)}</td>
                                <td className="px-3 py-2 text-xs">{tx.itemTitle || tx.itemId}</td>
                                <td className="px-3 py-2 text-xs">
                                  <Link to={`/users/${tx.buyerId}`} className="text-blue-600 hover:underline">{tx.buyerName || tx.buyerId}</Link>
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  <Link to={`/users/${tx.sellerId}`} className="text-blue-600 hover:underline">{tx.sellerName || tx.sellerId}</Link>
                                </td>
                                <td className="px-3 py-2 text-xs font-bold">¥{tx.price?.toLocaleString()}</td>
                                <td className="px-3 py-2 text-xs">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${tx.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {tx.status || '-'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  {matchingReview ? `⭐ ${typeof matchingReview.rating === 'number' ? matchingReview.rating.toFixed(1) : matchingReview.rating}` : 'N/A'}
                                </td>
                                <td className="px-3 py-2 text-xs">{matchingReview?.comment || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* フォロー関係一覧（全体） */}
                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3">フォロー関係（全体俯瞰）
                    <span className="ml-2 text-xs text-gray-500">全フォロー {follows.length}件</span>
                  </h3>
                  {follows.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">フォロー関係はありません</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-3 py-2 text-left text-xs font-bold">フォロワー</th>
                            <th className="px-3 py-2 text-left text-xs font-bold">→</th>
                            <th className="px-3 py-2 text-left text-xs font-bold">フォロー対象</th>
                          </tr>
                        </thead>
                        <tbody>
                          {follows.map((f, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="px-3 py-2 text-xs">
                                <Link to={`/users/${f.followerId}`} className="text-blue-600 hover:underline">{f.followerId}</Link>
                              </td>
                              <td className="px-3 py-2 text-xs text-center">→</td>
                              <td className="px-3 py-2 text-xs">
                                <Link to={`/users/${f.followingId}`} className="text-blue-600 hover:underline">{f.followingId}</Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* 全レビュー一覧（マッチング外） */}
                <section>
                  <h3 className="text-lg font-bold mb-3">全レビュー詳細</h3>
                  {reviews.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">レビューはありません</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-3 py-2 text-left text-xs font-bold">ID</th>
                            <th className="px-3 py-2 text-left text-xs font-bold">評価者</th>
                            <th className="px-3 py-2 text-left text-xs font-bold">対象ユーザー</th>
                            <th className="px-3 py-2 text-left text-xs font-bold">☆</th>
                            <th className="px-3 py-2 text-left text-xs font-bold">コメント</th>
                            <th className="px-3 py-2 text-left text-xs font-bold">日時</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reviews.map((r: any) => (
                            <tr key={r.id} className="border-b hover:bg-gray-50">
                              <td className="px-3 py-2 text-xs font-mono text-gray-600">{r.id?.substring(0, 8)}</td>
                              <td className="px-3 py-2 text-xs">
                                <Link to={`/users/${r.reviewerId}`} className="text-blue-600 hover:underline">{r.reviewerId}</Link>
                              </td>
                              <td className="px-3 py-2 text-xs">
                                <Link to={`/users/${r.reviewedUserId}`} className="text-blue-600 hover:underline">{r.reviewedUserId}</Link>
                              </td>
                              <td className="px-3 py-2 text-xs">⭐ {typeof r.rating === 'number' ? r.rating.toFixed(1) : r.rating || 'N/A'}</td>
                              <td className="px-3 py-2 text-xs">{r.comment || '-'}</td>
                              <td className="px-3 py-2 text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleString('ja-JP') : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}

        {/* ユーザー管理タブ */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-4xl">👥</span>
              ユーザー一覧
            </h2>
            {loading ? (
              <div className="text-center text-gray-500 py-12">読み込み中...</div>
            ) : users.length === 0 ? (
              <div className="text-center text-gray-500 py-12">ユーザーがいません</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-4 py-3 text-left text-sm font-bold">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-bold">名前</th>
                      <th className="px-4 py-3 text-left text-sm font-bold">評価</th>
                      <th className="px-4 py-3 text-left text-sm font-bold">販売数</th>
                      <th className="px-4 py-3 text-left text-sm font-bold">フォロワー</th>
                      <th className="px-4 py-3 text-left text-sm font-bold">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const dynRating = userRatings.get(user.id);
                      const dynFollowers = userFollowerCounts.get(user.id);
                      const txCount = userTransactionCounts.get(user.id) || 0;
                      // 取引数0なら☆はN/A
                      const displayRating = txCount > 0 && typeof dynRating === 'number' ? dynRating.toFixed(1) : 'N/A';
                      return (
                        <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs font-mono text-gray-600">{user.id}</td>
                          <td className="px-4 py-3 font-semibold">{user.name}</td>
                          <td className="px-4 py-3">⭐ {displayRating}</td>
                          <td className="px-4 py-3">{txCount}</td>
                          <td className="px-4 py-3">{typeof dynFollowers === 'number' ? dynFollowers : (user.followerCount || 0)}</td>
                          <td className="px-4 py-3">
                            <Link
                              to={`/users/${user.id}`}
                              className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                            >
                              詳細 →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 商品管理タブ */}
        {activeTab === 'items' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-4xl">📦</span>
              商品一覧
            </h2>
            {loading ? (
              <div className="text-center text-gray-500 py-12">読み込み中...</div>
            ) : items.length === 0 ? (
              <div className="text-center text-gray-500 py-12">商品がありません</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {items.map((item) => {
                  const detailUrl = `/admin/item/${item.id}`;
                  return (
                    <Link
                      key={item.id}
                      to={detailUrl}
                      className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition block"
                    >
                      <img src={item.imageUrl} alt={item.itemname} className="w-full h-40 object-cover" />
                      <div className="p-3">
                        <div className="font-bold text-sm mb-1 truncate">{item.itemname}</div>
                        <div className="text-red-600 font-black text-lg">¥{item.price.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 mt-1">ID: {item.id}</div>
                        {item.isSoldOut && (
                          <div className="mt-2 bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded text-center">
                            売り切れ
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 通報管理タブ */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-4xl">⚠️</span>
              通報一覧
            </h2>
            {loading ? (
              <div className="text-center text-gray-500 py-12">読み込み中...</div>
            ) : reports.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <div className="text-6xl mb-4">✅</div>
                <div className="font-bold">通報はありません</div>
                <div className="text-sm mt-2">現在、対応が必要な通報はありません。</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-bold">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-bold">通報者</th>
                      <th className="px-4 py-3 text-left text-sm font-bold">対象ユーザー</th>
                      <th className="px-4 py-3 text-left text-sm font-bold">理由</th>
                      <th className="px-4 py-3 text-left text-sm font-bold">日時</th>
                      <th className="px-4 py-3 text-left text-sm font-bold">ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{report.id}</td>
                        <td className="px-4 py-3 text-sm">{report.reporterId || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <Link to={`/users/${report.reportedUserId}`} className="text-blue-600 hover:underline">
                            {report.reportedUserId}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm">{report.reason || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          {report.createdAt ? new Date(report.createdAt).toLocaleString('ja-JP') : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">
                            {report.status || '未対応'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

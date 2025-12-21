import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import type { Seller } from '../types';
import { getSellerById } from '../api/getSellers';
import { fetchCurrentUser, upsertCurrentUser } from '../api/currentUser';
import { getItems, getItemById } from '../../items/api/getItems';
import { apiClient } from '../../../lib/axios';
import type { Item } from '../../items/types';
import { ItemCard } from '../../items/components/ItemCard';
import { FollowButton } from '../components/FollowButton';

export const UserProfile = () => {
  const { userId: urlUserId } = useParams(); // URLからIDを取得 (例: /users/user_001)
  const { user: currentUser, userId: currentUserId } = useAuth(); // ログイン中のユーザー
  const navigate = useNavigate();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  // 追加セクション用の状態
  const [warehouseInvestItems, setWarehouseInvestItems] = useState<Item[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<Item[]>([]);
  const [chatItems, setChatItems] = useState<Item[]>([]);
  const [likedItems, setLikedItems] = useState<Item[]>([]);
  const [watchedItems, setWatchedItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  // 動的計算用の状態
  const [followerCount, setFollowerCount] = useState(0);
  const [ratingAvg, setRatingAvg] = useState(0);
  const [followers, setFollowers] = useState<any[]>([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const isOwnProfile = currentUser && urlUserId === currentUserId;

  const handleFollowToggle = (nextIsFollowing: boolean) => {
    setSeller((prev) => {
      if (!prev) return prev;
      const currentCount = prev.followerCount ?? 0;
      const nextCount = nextIsFollowing
        ? currentCount + 1
        : Math.max(0, currentCount - 1);
      return { ...prev, followerCount: nextCount };
    });
  };

  console.log('[UserProfile] Render:', { urlUserId, currentUserId, isOwnProfile });

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log('[UserProfile] useEffect start:', { urlUserId, isOwnProfile });
      setLoading(true);
      setError(null);
      let s: Seller | null = null;
      
      // 自分のプロフィールの場合は /api/auth/me を使用、他人の場合は /api/users/{id}
      if (isOwnProfile) {
        console.log('[UserProfile] Fetching own profile via /api/auth/me');
        try {
          s = await fetchCurrentUser();
          console.log('[UserProfile] fetchCurrentUser result:', s);
          if (!s?.id) {
            console.error('[UserProfile] Current user has no id');
            setError('profile_not_found');
            setTimeout(() => {
              if (mounted) navigate('/onboarding');
            }, 3000);
          }
        } catch (err: any) {
          console.error('[UserProfile] fetchCurrentUser error:', err);
          // ユーザーが DB に存在しない場合、自動作成を試みる
          if (err?.response?.status === 404) {
            console.log('[UserProfile] User not in DB, attempting auto-creation');
            try {
              const displayName = currentUser?.displayName || 'ユーザー';
              const photoURL = currentUser?.photoURL || '';
              await upsertCurrentUser({ 
                username: displayName, 
                avatarUrl: photoURL || undefined, 
                bio: '' 
              });
              // 再度取得
              s = await fetchCurrentUser();
              console.log('[UserProfile] After auto-creation, user:', s);
              if (s && mounted) {
                setSeller(s);
                setLoading(false);
                return;
              }
            } catch (autoCreateErr) {
              console.error('[UserProfile] Auto-creation failed:', autoCreateErr);
            }
            // オートクリエーション失敗時はオンボーディングへ
            setError('profile_not_found');
            setTimeout(() => {
              if (mounted) navigate('/onboarding');
            }, 1000);
          } else {
            console.error('[UserProfile] Failed to fetch current user:', err?.response?.status, err?.response?.data);
            setError('fetch_error');
          }
        }
      } else {
        console.log('[UserProfile] Fetching other user profile:', urlUserId);
        // 他人のプロフィール - Firebase UID で取得を試みる
        try {
          s = await getSellerById(String(urlUserId));
          console.log('[UserProfile] getSellerById result:', s);
          if (!s) {
            // APIから何も返されなかった場合、ユーザーIDだけで基本データを作成
            console.warn('[UserProfile] No seller data, creating minimal user object for:', urlUserId);
            s = {
              id: String(urlUserId),
              username: String(urlUserId),
              bio: '',
              avatarUrl: '',
              sellingCount: 0,
              followerCount: 0,
              rating: 0,
            };
          }
        } catch (err: any) {
          console.error('[UserProfile] Failed to fetch seller:', urlUserId, err);
          // エラー時もミニマルオブジェクトを作成
          s = {
            id: String(urlUserId),
            username: String(urlUserId),
            bio: '',
            avatarUrl: '',
            sellingCount: 0,
            followerCount: 0,
            rating: 0,
          };
        }
      }
      
      console.log('[UserProfile] Final seller:', s);
      if (mounted) setSeller(s);
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [urlUserId, currentUser, isOwnProfile, navigate]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setItemsLoading(true);
      try {
        const all = await getItems();
        const filtered = all.filter((it) => String(it.sellerId) === String(urlUserId));
        if (mounted) setItems(filtered);

        // いいね/注目（ウォッチ）: 対象ユーザー（自分 or 他人）で共通取得
        try {
          const targetUserId = isOwnProfile ? currentUserId : urlUserId;
          if (targetUserId) {
            const reactionsRes = await apiClient.get(`/api/reactions/users/${targetUserId}`);
            const reactions: any[] = reactionsRes?.data?.reactions ?? [];

            const likedIds: string[] = reactions
              .filter((r: any) => r.reactionType === 'like')
              .map((r: any) => String(r.itemId));
            const watchedIds: string[] = reactions
              .filter((r: any) => r.reactionType === 'watch')
              .map((r: any) => String(r.itemId));

            const likedFromAll = all.filter((it) => likedIds.includes(String(it.id)));
            const watchedFromAll = all.filter((it) => watchedIds.includes(String(it.id)));

            const likedMissingIds = likedIds.filter((id) => !likedFromAll.some((it) => String(it.id) === id));
            const watchedMissingIds = watchedIds.filter((id) => !watchedFromAll.some((it) => String(it.id) === id));

            const [likedMissingItems, watchedMissingItems] = await Promise.all([
              Promise.all(likedMissingIds.map((id) => getItemById(id))).then((arr) => arr.filter(Boolean) as Item[]),
              Promise.all(watchedMissingIds.map((id) => getItemById(id))).then((arr) => arr.filter(Boolean) as Item[]),
            ]);

            if (mounted) {
              setLikedItems([...likedFromAll, ...likedMissingItems]);
              setWatchedItems([...watchedFromAll, ...watchedMissingItems]);
            }
          } else {
            if (mounted) {
              setLikedItems([]);
              setWatchedItems([]);
            }
          }
        } catch {}

        // 自分のプロフィール閲覧時のみ追加セクション（購入/倉庫/チャット）をロード
        if (isOwnProfile) {
          // 取引履歴から購入済み・倉庫保管（投資）を分類
          try {
            console.log('[UserProfile] Fetching transactions for:', currentUserId);
            const txRes = await apiClient.get(`/api/transactions/user/${currentUserId}`).catch((err) => {
              console.error('[UserProfile] Transaction fetch error:', err);
              return { data: [] };
            });
            const txs = Array.isArray(txRes.data) ? txRes.data : [];
            console.log('[UserProfile] All transactions:', txs);
            const myPurchases = txs.filter((tx: any) => String(tx.buyerId) === String(currentUserId));
            console.log('[UserProfile] My purchases (filtered by buyerId):', myPurchases);
            
            const purchased: Item[] = [];
            const warehouse: Item[] = [];
            
            myPurchases.forEach((tx: any) => {
              // トランザクションレスポンスから商品情報を構築（sold out 商品も含む）
              const item = {
                id: tx.itemId,
                itemname: tx.itemTitle || 'タイトル不明',
                price: tx.price,
                imageUrl: tx.itemImageUrl || '',
                isSoldOut: true, // 購入済み商品は必ず sold out
                sellerId: tx.sellerId,
                isInvestItem: false, // デフォルトは通常商品扱い
              } as Item;
              
              // itemMap から追加情報を取得（存在する場合のみ）
              const fullItem = all.find(it => String(it.id) === String(tx.itemId));
              if (fullItem) {
                item.isInvestItem = fullItem.isInvestItem || false;
                item.description = fullItem.description;
                item.category = fullItem.category;
                item.condition = fullItem.condition;
              }
              
              console.log(`[UserProfile] Constructed item from tx ${tx.id}:`, item);
              
              // warehouse フラグで分類
              if (tx.warehouse) {
                warehouse.push(item);
                console.log('[UserProfile] Added to warehouse:', item.id);
              } else if (item.isInvestItem) {
                warehouse.push(item);
                console.log('[UserProfile] Added to warehouse (isInvestItem):', item.id);
              } else {
                purchased.push(item);
                console.log('[UserProfile] Added to purchased:', item.id);
              }
            });
            
            console.log('[UserProfile] Final - purchased:', purchased.length, 'warehouse:', warehouse.length);
            if (mounted) {
              setPurchasedItems(purchased);
              setWarehouseInvestItems(warehouse);
            }
          } catch (err) {
            console.error('[UserProfile] Transaction processing error:', err);
          }

          // 進行中チャットの商品: /api/conversations by user から itemId を収集
          try {
            const convRes = await apiClient.get(`/api/conversations`, { params: { userId: currentUserId }});
            const itemIds: string[] = Array.isArray(convRes.data) ? convRes.data.map((c: any) => c.itemId) : [];
            const chatItms = all.filter((it) => itemIds.includes(String(it.id)));
            if (mounted) setChatItems(chatItms);
          } catch {}
        }

        // フォロワー数を動的計算（全ユーザー対象）：/api/follows/followers/:userId から計算
        try {
          const followersRes = await apiClient.get(`/api/follows/followers/${urlUserId}`);
          // レスポンスは {"followers": [...]} の構造
          const followersData = followersRes.data?.followers ? followersRes.data.followers : [];
          if (mounted) {
            setFollowers(Array.isArray(followersData) ? followersData : []);
            setFollowerCount(Array.isArray(followersData) ? followersData.length : 0);
          }
        } catch {
          if (mounted && seller) setFollowerCount(seller.followerCount ?? 0);
        }

        // ☆平均値を動的計算（全ユーザー対象）：取引数>0の場合のみ。/api/reviews/user/:userId から該当ユーザーへのレビューを集計
        try {
          // 取引数を確認
          const txRes = await apiClient.get(`/api/transactions/user/${urlUserId}`).catch(() => ({ data: [] }));
          const userTransactions = Array.isArray(txRes.data) ? txRes.data : [];
          
          if (userTransactions.length > 0) {
            // 取引がある場合のみレビューを取得
            const reviewsRes = await apiClient.get(`/api/reviews/user/${urlUserId}`);
            const userReviews = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
            const avgRating = userReviews.length > 0 
              ? userReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / userReviews.length 
              : 0;
            if (mounted) setRatingAvg(avgRating);
          } else {
            // 取引がない場合は☆を0（N/A扱い）
            if (mounted) setRatingAvg(0);
          }
        } catch {
          if (mounted) setRatingAvg(0);
        }
      } finally {
        if (mounted) setItemsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [urlUserId, currentUserId, isOwnProfile]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
        <p className="mt-4 text-gray-600">読み込み中...</p>
      </div>
    </div>
  );

  if (error === 'profile_not_found') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">プロフィール未設定</h2>
          <p className="text-gray-600 mb-6">
            プロフィールを作成してください。<br/>
            3秒後に自動で設定画面に移動します...
          </p>
          <button 
            onClick={() => navigate('/onboarding')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            今すぐ設定する
          </button>
        </div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error === 'profile_not_found' ? 'プロフィール未設定' : 'ユーザーが見つかりません'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error === 'profile_not_found' 
              ? 'プロフィールを作成してください。5秒後に自動で設定画面に移動します...'
              : '指定されたユーザーは存在しないか、削除された可能性があります。'}
          </p>
          <div className="text-xs text-gray-400 mb-4 p-2 bg-gray-100 rounded break-all font-mono">
            uid: {currentUser?.uid ? currentUser.uid.substring(0, 16) + '...' : 'null'}
            {'\n'}
            error: {error || 'none'}
          </div>
          {error !== 'profile_not_found' && (
            <Link to="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
              ホームに戻る
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* 戻るヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-50 px-4 h-14 flex items-center">
        <Link to="/" className="text-gray-600 font-bold flex items-center gap-1 hover:text-black">
          ← ホームに戻る
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* プロフィールカード */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <img 
            src={seller.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.username)}&size=200`} 
            alt={seller.username} 
            className="w-24 h-24 rounded-full border-4 border-gray-100 shadow-md"
          />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{seller.username}</h1>
            <div className="text-sm text-gray-500">ID: {seller.id}</div>
            <div className="flex justify-center sm:justify-start gap-4 text-sm text-gray-600 mb-4">
              <span>出品数 <b>{seller.sellingCount ?? 0}</b></span>
              <button 
                onClick={() => setShowFollowersModal(true)}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                フォロワー <b>{followerCount || (seller.followerCount ?? 0)}</b>
              </button>
              <span className="text-yellow-500 font-bold">★ {ratingAvg > 0 ? ratingAvg.toFixed(1) : '—'}</span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-lg text-left">
              {seller.bio || 'プロフィール未設定'}
            </p>
            {!isOwnProfile && (
              <div className="mt-4 flex gap-3">
                {currentUserId ? (
                  <>
                    <FollowButton
                      currentUserId={currentUserId}
                      targetUserId={seller.id}
                      onToggle={handleFollowToggle}
                    />
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-full font-bold text-sm hover:bg-red-50 transition"
                    >
                      ⚠️ 通報する
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="inline-block w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-blue-700 transition text-center"
                  >
                    ログインしてフォロー
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 出品リスト */}
        <h2 className="text-lg font-bold mb-4">{isOwnProfile ? 'あなたの出品' : 'この出品者の商品'}</h2>
        {itemsLoading ? (
          <div className="p-6 text-center">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-white rounded-xl">
            {isOwnProfile ? 'まだ出品がありません。' : 'この出品者の出品はありません。'}
            {isOwnProfile && (
              <div className="mt-4">
                <Link to="/create-listing" className="inline-block bg-red-500 text-white px-6 py-3 rounded-full font-bold hover:bg-red-600 transition">
                  出品する
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {items.map((it) => (
              <ItemCard key={it.id} item={it} />
            ))}
          </div>
        )}

        {/* 追加セクション: 自分のページのみ */}
        {isOwnProfile && (
          <div className="mt-10 space-y-8">
            {/* 購入済みの商品（通常） */}
            <section>
              <h3 className="text-lg font-bold mb-3">購入済みの商品</h3>
              {purchasedItems.length === 0 ? (
                <div className="p-4 text-center text-gray-500 bg-white rounded-xl">購入済みの商品はありません</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {purchasedItems.map((it) => (
                    <ItemCard key={it.id} item={it} />
                  ))}
                </div>
              )}
            </section>

            {/* 倉庫保管の投資目的商品 */}
            <section>
              <h3 className="text-lg font-bold mb-3">倉庫保管中の投資目的商品</h3>
              {warehouseInvestItems.length === 0 ? (
                <div className="p-4 text-center text-gray-500 bg-white rounded-xl">該当する商品はありません</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {warehouseInvestItems.map((it) => (
                    <div key={it.id} className="space-y-2">
                      <ItemCard item={it} />
                      <Link
                        to={`/create-listing?source=${it.id}`}
                        className="block text-center w-full bg-indigo-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-indigo-700 transition"
                      >
                        再出品する
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 今チャットしている商品 */}
            <section>
              <h3 className="text-lg font-bold mb-3">現在チャット中の商品</h3>
              {chatItems.length === 0 ? (
                <div className="p-4 text-center text-gray-500 bg-white rounded-xl">チャット中の商品はありません</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {chatItems.map((it) => (
                    <ItemCard key={it.id} item={it} />
                  ))}
                </div>
              )}
            </section>

          </div>
        )}
      </div>

      {/* いいね・注目（全ユーザー対象で表示） */}
      <div className="max-w-3xl mx-auto px-4 mt-10 space-y-8">
        {/* いいねした商品（自分 or このユーザー） */}
        <section>
          <h3 className="text-lg font-bold mb-3">{isOwnProfile ? 'いいねした商品' : 'このユーザーがいいねした商品'}</h3>
          {likedItems.length === 0 ? (
            <div className="p-4 text-center text-gray-500 bg-white rounded-xl">
              {isOwnProfile ? 'いいね済みの商品はありません' : 'いいね済みの商品はありません'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {likedItems.map((it) => (
                <ItemCard key={it.id} item={it} />
              ))}
            </div>
          )}
        </section>

        {/* 注目（ウォッチ）している商品（自分 or このユーザー） */}
        <section>
          <h3 className="text-lg font-bold mb-3">{isOwnProfile ? '注目している商品' : 'このユーザーが注目している商品'}</h3>
          {watchedItems.length === 0 ? (
            <div className="p-4 text-center text-gray-500 bg-white rounded-xl">
              {isOwnProfile ? '注目中の商品はありません' : '注目中の商品はありません'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {watchedItems.map((it) => (
                <ItemCard key={it.id} item={it} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* フォロワー一覧モーダル */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowFollowersModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold">フォロワー一覧</h2>
              <button onClick={() => setShowFollowersModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              {followers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  フォロワーはまだいません
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {followers.map((follower: any) => (
                    <Link
                      key={follower.follower_id || follower.followerId}
                      to={`/users/${follower.follower_id || follower.followerId}`}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 transition"
                      onClick={() => setShowFollowersModal(false)}
                    >
                      <img
                        src={follower.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.follower_id || follower.followerId)}&size=100`}
                        alt=""
                        className="w-12 h-12 rounded-full border-2 border-gray-100"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{follower.name || follower.follower_id || follower.followerId}</div>
                        <div className="text-xs text-gray-500">ID: {follower.follower_id || follower.followerId}</div>
                      </div>
                      <div className="text-gray-400">
                        →
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 通報モーダル */}
      {showReportModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">ユーザーを通報</h3>
            <p className="text-sm text-gray-600 mb-4">
              不適切な行動や規約違反を発見した場合は、以下のフォームから通報してください。
            </p>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">通報理由 *</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              >
                <option value="">選択してください</option>
                <option value="詐欺・偽造">詐欺・偽造</option>
                <option value="スパム">スパム</option>
                <option value="不適切な内容">不適切な内容</option>
                <option value="偽物販売">偽物販売</option>
                <option value="その他">その他</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">詳細情報</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 h-24 resize-none"
                placeholder="詳しい状況を記載してください（任意）"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDescription('');
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition"
                disabled={reportSubmitting}
              >
                キャンセル
              </button>
              <button
                onClick={async () => {
                  if (!reportReason) {
                    alert('通報理由を選択してください');
                    return;
                  }
                  setReportSubmitting(true);
                  try {
                    await apiClient.post('/api/reports', {
                      reportedUserId: seller.id,
                      reason: reportReason,
                      description: reportDescription,
                    });
                    alert('通報を受け付けました。ご協力ありがとうございます。');
                    setShowReportModal(false);
                    setReportReason('');
                    setReportDescription('');
                  } catch (error) {
                    console.error('Report submission error:', error);
                    alert('通報の送信に失敗しました。');
                  } finally {
                    setReportSubmitting(false);
                  }
                }}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50"
                disabled={reportSubmitting}
              >
                {reportSubmitting ? '送信中...' : '通報する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

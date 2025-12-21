type FollowRecord = {
  id: string;
  followerId: string;
  followeeId: string;
  createdAt: string;
};

type UserSummary = {
  id: string;
  name: string;
  avatarUrl?: string;
  rating?: number;
};

type ReactionRecord = {
  id: string;
  itemId: string;
  userId: string;
  reactionType: string;
  createdAt: string;
};

type ItemSummary = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
};
import { useState } from 'react';
import { Link } from 'react-router-dom';
// import { apiClient } from '@/lib/axios';
import { ReactionButtons } from '@/components/Reactions/ReactionButtons';

// 型定義は残し、state・変数宣言は関数内だけにする

  // 必要なstate・変数のみ残し、未使用は削除
function UserPage() {
    const [tab, setTab] = useState<'followers' | 'following' | 'likes' | 'listings'>('followers');
    const [followers] = useState<FollowRecord[]>([]);
    const [following] = useState<FollowRecord[]>([]);
    const [likes] = useState<ReactionRecord[]>([]);
    const [listings] = useState<ItemSummary[]>([]);
    const [itemsById] = useState<Record<string, ItemSummary>>({});
    const [usersById] = useState<Record<string, UserSummary>>({});
    const [loading] = useState(false);
    const [page, setPage] = useState(0);
    const limit = 20;
    const currentUserId = "";
  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex">
            {[
              { key: 'followers', label: 'フォロワー一覧' },
              { key: 'following', label: 'フォロー一覧' },
              { key: 'likes', label: 'いいねした商品' },
              { key: 'listings', label: '出品商品' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`flex-1 p-3 text-sm font-bold border-b-2 ${tab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-4">
            {loading && <div className="text-center text-gray-500">読み込み中...</div>}

            {!loading && tab === 'followers' && (
              <div className="space-y-3">
                {followers.length === 0 ? (
                  <div className="text-sm text-gray-600">フォロワーはいません。</div>
                ) : (
                  followers.map((rec: FollowRecord) => {
                    const u = usersById[rec.followerId];
                    const isMutual = following.some((f: FollowRecord) => f.followeeId === rec.followerId);
                    return (
                      <div key={rec.id} className="flex items-center gap-3 p-2 border rounded-lg">
                        <Link to={`/users/${rec.followerId}`} className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          <img src={u?.avatarUrl ?? `https://i.pravatar.cc/100?u=${rec.followerId}`} alt="avatar" className="w-full h-full object-cover" />
                        </Link>
                        <div className="flex-1">
                          <div className="font-bold flex items-center gap-2">
                            {u?.name ?? rec.followerId}
                            {isMutual && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">相互</span>}
                          </div>
                          <div className="text-xs text-gray-500">評価: ★{u?.rating ?? '—'} / フォロー日時 {new Date(rec.createdAt).toLocaleString()}</div>
                        </div>
                        <Link to={`/users/${rec.followerId}`} className="text-sm text-indigo-600">詳細</Link>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {!loading && tab === 'following' && (
              <div className="space-y-3">
                {following.length === 0 ? (
                  <div className="text-sm text-gray-600">フォローしているユーザはいません。</div>
                ) : (
                  following.map((rec: FollowRecord) => {
                    const u = usersById[rec.followeeId];
                    const isMutual = followers.some((f: FollowRecord) => f.followerId === rec.followeeId);
                    return (
                      <div key={rec.id} className="flex items-center gap-3 p-2 border rounded-lg">
                        <Link to={`/users/${rec.followeeId}`} className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          <img src={u?.avatarUrl ?? `https://i.pravatar.cc/100?u=${rec.followeeId}`} alt="avatar" className="w-full h-full object-cover" />
                        </Link>
                        <div className="flex-1">
                          <div className="font-bold flex items-center gap-2">
                            {u?.name ?? rec.followeeId}
                            {isMutual && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">相互</span>}
                          </div>
                          <div className="text-xs text-gray-500">評価: ★{u?.rating ?? '—'} / フォロー日時 {new Date(rec.createdAt).toLocaleString()}</div>
                        </div>
                        <Link to={`/users/${rec.followeeId}`} className="text-sm text-indigo-600">詳細</Link>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {!loading && tab === 'likes' && (
              <div className="grid grid-cols-2 gap-3">
                {likes.length === 0 ? (
                  <div className="text-sm text-gray-600">まだ「いいね」した商品はありません。</div>
                ) : (
                  likes.map((r: ReactionRecord) => {
                    const it = itemsById[r.itemId];
                    return (
                      <Link key={r.id} to={`/items/${r.itemId}`} className="border rounded-lg overflow-hidden block hover:shadow-md transition">
                        <img src={it?.imageUrl ?? `https://picsum.photos/seed/${r.itemId}/200/160`} alt={it?.name ?? r.itemId} className="w-full h-24 object-cover" />
                        <div className="p-2">
                          <div className="font-bold text-sm line-clamp-2">{it?.name ?? r.itemId}</div>
                          <div className="text-xs text-gray-600 mt-1">¥{(it?.price ?? 0).toLocaleString()}</div>
                          <div className="text-[11px] text-gray-500 mt-1">リアクション: {r.reactionType} / {new Date(r.createdAt).toLocaleDateString()}</div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            )}

            {!loading && tab === 'listings' && (
              <div className="space-y-3">
                {listings.length === 0 ? (
                  <div className="text-sm text-gray-600">出品商品はありません。</div>
                ) : (
                  listings.map((it: ItemSummary) => (
                    <div key={it.id} className="border rounded-lg overflow-hidden hover:shadow-md transition p-3 flex gap-3">
                      <Link to={`/items/${it.id}`} className="flex-1 flex gap-3">
                        <img src={it.imageUrl ?? `https://picsum.photos/seed/${it.id}/200/160`} alt={it.name} className="w-20 h-20 object-cover rounded" />
                        <div className="flex-1">
                          <div className="font-bold text-sm line-clamp-2">{it.name}</div>
                          <div className="text-xs text-gray-600 mt-1">¥{it.price.toLocaleString()}</div>
                        </div>
                      </Link>
                      <div className="flex-shrink-0">
                        {currentUserId && <ReactionButtons itemId={it.id} userId={currentUserId} />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-3 border-t">
            <button
              onClick={() => setPage((p: number) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
            >
              前へ
            </button>
            <div className="text-sm text-gray-600">ページ {page + 1}</div>
            <button
              onClick={() => setPage((p: number) => p + 1)}
              disabled={(tab === 'followers' && followers.length < limit) || (tab === 'following' && following.length < limit) || (tab === 'likes' && likes.length < limit) || (tab === 'listings' && listings.length < limit)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
            >
              次へ
            </button>
          </div>
        </div>
      </main>
    </div>
  );

}
export default UserPage;

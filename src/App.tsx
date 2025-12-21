import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { CLASSIFICATION_TREE, type CategoryNode } from './features/items/types/classification';
import { apiClient } from './lib/axios';

// --- 各機能のルートコンポーネントをインポート ---
// ※ファイルパスが合っているか確認してください
import { UserProfile } from './features/users/routes/UserProfile';
import { UserOnboarding } from './features/users/routes/UserOnboarding';
import { SignUp } from './features/auth/routes/SignUp';
import { Login } from './features/auth/routes/Login';
import { AdminDashboard } from './features/admin/routes/AdminDashboard';
import { AdminItemDetail } from './features/admin/routes/AdminItemDetail';
import { AdminTransactions } from './features/admin/routes/AdminTransactions';
import { UserTransactions } from './features/trade/routes/UserTransactions';
import { SellItem } from './features/sell/routes/SellItem';       // NEW
import { PurchaseItem } from './features/trade/routes/PurchaseItem'; // NEW
import { ChatRoom } from './features/chat/routes/ChatRoom';       // NEW
import { CreateListing } from './features/items/routes/CreateListing'; // NEW
import type { Item } from './features/items/types';
import { getItems } from './features/items/api/getItems';
import { MobileBottomNav } from './components/Layout/MobileBottomNav';

// --- アイテムは API（モック含む）から取得して ID で連携 ---
// `getItems()` を使用して、各商品ページ（/purchase/:itemId /trade/:itemId）と整合させます

// --- 保護ルート ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// --- 管理者ルート ---
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  console.log('[AdminRoute] user:', user?.uid, 'isAdmin:', isAdmin);

  if (!isAdmin) {
    console.log('[AdminRoute] Access denied. Redirecting to login.');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// --- ホーム画面コンポーネント ---
const Home = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // User input
  
  console.log('[Home RENDER] items.length:', items.length, 'loading:', loading);
  
  // フィルター状態
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<{ code: string; label: string }[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showInvestOnly, setShowInvestOnly] = useState(false);
  const [showNormalOnly, setShowNormalOnly] = useState(false);
  const [sortBy, setSortBy] = useState('priority');

  // カテゴリツリーをフラット化
  const flattenCategories = (nodes: CategoryNode[]): { code: string; label: string }[] => {
    const result: { code: string; label: string }[] = [];
    const traverse = (node: CategoryNode, parentLabel = '') => {
      const fullLabel = parentLabel ? `${parentLabel} > ${node.label}` : node.label;
      result.push({ code: node.code, label: fullLabel });
      if (node.children) {
        node.children.forEach(child => traverse(child, fullLabel));
      }
    };
    nodes.forEach(node => traverse(node));
    return result;
  };

  // カテゴリ一覧をロード
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await apiClient.get('/api/categories');
        const data = res.data;
        // 以前の動作に戻す（レスポンスが配列でない場合はローカル定義にフォールバック）
        if (Array.isArray(data) && data.length > 0) {
          setCategories(flattenCategories(data));
        } else {
          // フォールバック：ローカル定義を使用
          setCategories(flattenCategories(CLASSIFICATION_TREE));
        }
      } catch (err) {
        console.error('[Home] Failed to load categories:', err);
        // フォールバック：ローカル定義を使用
        setCategories(flattenCategories(CLASSIFICATION_TREE));
      }
    };
    loadCategories();
  }, []);

  // Debounce search input (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    
    const params = new URLSearchParams();
    if (searchQuery) params.append('query', searchQuery);
    if (selectedCategory) params.append('categoryCode', selectedCategory);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (showInvestOnly) params.append('investOnly', 'true');
    if (showNormalOnly) params.append('normalOnly', 'true');
    if (sortBy !== 'priority') params.append('sortBy', sortBy);
    
    const url = params.toString() 
      ? `/items?${params.toString()}`
      : '/items';
    
    console.log('[Home] Fetching items from URL:', url);
    
    getItems(url)
      .then((res) => {
        console.log('[Home] API response received. Items count:', res.length);
        console.log('[Home] First item:', res[0]);
        console.log('[Home] Calling setItems with:', res);
        setItems(res);
        console.log('[Home] setItems called successfully');
        setLoading(false);
      })
      .catch((error) => {
        console.error('[Home] Error fetching items:', error);
        setItems([]);
        setLoading(false);
      });
  }, [searchQuery, selectedCategory, minPrice, maxPrice, showInvestOnly, showNormalOnly, sortBy]);

  return (
    <div className="min-h-screen text-gray-800 pb-20 bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black text-red-500 tracking-tighter hover:opacity-80 transition">
            NextMarket
          </Link>
          <div className="flex gap-4 items-center">
            <Link to={user ? `/users/${user.uid}` : '/login'} className="font-bold text-sm text-gray-600 hover:text-black">
              マイページ
            </Link>
            {/* 新しい出品画面へのリンク */}
            <Link to="/create-listing" className="bg-red-500 text-white px-5 py-2 rounded-full font-bold hover:bg-red-600 transition shadow-lg text-sm">
              出品する
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 sm:py-8">
        
        {/* ヒーローバナー */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8 text-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10 max-w-xl">
            <span className="bg-yellow-400 text-black px-3 py-1 text-xs font-black rounded mb-3 inline-block tracking-wider">
              NEW ERA
            </span>
            <h2 className="text-2xl md:text-4xl font-bold mb-3 sm:mb-4 leading-tight">
              「好き」を「資産」に。<br/>次世代の取引プラットフォーム
            </h2>
            <p className="opacity-80 mb-4 sm:mb-6 text-sm leading-relaxed">
              倉庫保管型のデータ取引で、所有権を即座に売買。
            </p>
          </div>
          <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-indigo-900/50 to-transparent"></div>
          <div className="hidden sm:block text-9xl absolute -bottom-4 right-10 opacity-20 transform group-hover:scale-110 transition duration-700">
            📈
          </div>
        </div>

        {/* 検索バー */}
        <div className="mb-6 sm:mb-8">
          <div className="relative mb-4">
            <input 
              type="text" 
              placeholder="商品を探す... (複数キーワードはスペース区切り)" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              {loading && searchQuery ? '⏳' : '🔍'}
            </div>
          </div>

          {/* フィルターUI */}
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {/* カテゴリ */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">カテゴリ</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:border-red-500 bg-white"
                >
                  <option value="">すべてのカテゴリ</option>
                  {categories.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 価格範囲 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">価格範囲</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="number" 
                    placeholder="最小"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:border-red-500"
                  />
                  <span className="text-gray-400">〜</span>
                  <input 
                    type="number" 
                    placeholder="最大"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* 商品タイプ */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">商品タイプ</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setShowInvestOnly(!showInvestOnly);
                      if (!showInvestOnly) setShowNormalOnly(false);
                    }}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg font-semibold transition ${
                      showInvestOnly 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    📈 投資商品
                  </button>
                  <button 
                    onClick={() => {
                      setShowNormalOnly(!showNormalOnly);
                      if (!showNormalOnly) setShowInvestOnly(false);
                    }}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg font-semibold transition ${
                      showNormalOnly 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🛒 通常商品
                  </button>
                </div>
              </div>

              {/* ソート順 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">並び替え</label>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:border-red-500 bg-white"
                >
                  <option value="priority">おすすめ順</option>
                  <option value="newest">新着順</option>
                  <option value="price_asc">価格が安い順</option>
                  <option value="price_desc">価格が高い順</option>
                </select>
              </div>
            </div>

            {/* フィルタークリアボタン */}
            {(searchInput || minPrice || maxPrice || showInvestOnly || showNormalOnly || sortBy !== 'priority') && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button 
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                    setMinPrice('');
                    setMaxPrice('');
                    setShowInvestOnly(false);
                    setShowNormalOnly(false);
                    setSortBy('priority');
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold"
                >
                  すべてのフィルターをクリア
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 検索結果の件数表示 */}
        {searchQuery && (
          <div className="mb-4 text-sm text-gray-600">
            「{searchQuery}」の検索結果: {items.length}件
          </div>
        )}



        {/* 商品一覧 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span className="w-1.5 h-6 bg-red-500 rounded-full"></span>
            {searchQuery ? '検索結果' : '新着アイテム'}
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(() => {
            console.log('[Home RENDER] Rendering items. loading:', loading, 'items.length:', items.length);
            if (loading) {
              return <div className="col-span-full text-center text-sm text-gray-500 py-10">読み込み中...</div>;
            }
            if (items.length === 0) {
              return <div className="col-span-full text-center text-sm text-gray-500 py-10">アイテムが見つかりません</div>;
            }
            console.log('[Home RENDER] About to map', items.length, 'items');
            return items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group relative border border-gray-100">

                <Link to={(item as any).isInvestItem ? `/trade/${item.id}` : `/purchase/${item.id}`}>
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      loading="lazy"
                    />

                    {(item as any).isInvestItem && (
                      <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded border border-gray-600 flex items-center gap-1 z-10">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        ASSET
                      </div>
                    )}

                    {item.isSoldOut && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                        <span className="text-white font-black text-xl border-4 border-white px-2 py-1 transform -rotate-12">
                          SOLD
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                      <div className="text-white font-bold text-lg">
                        ¥{typeof item.price === 'number' && !isNaN(item.price) ? item.price.toLocaleString() : '0'}
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="p-3">
                  <h4 className="text-xs text-gray-500 line-clamp-2 min-h-[2.5em] mb-2 leading-relaxed font-medium">
                    {item.title}
                  </h4>
                  {/* 出品者評価（平均） */}
                  <div className="text-[11px] text-yellow-600 mb-1">
                    ⭐ {typeof item.sellerRating === 'number' ? item.sellerRating.toFixed(1) : '—'}
                  </div>
                  {/* 反応カウント */}
                  <div className="text-[11px] text-gray-500 mb-2 flex gap-3">
                    <span>❤️ {item.likeCount ?? 0}</span>
                    <span>👀 {item.watchCount ?? 0}</span>
                  </div>

                  <Link to={`/users/${item.sellerId}`} className="flex items-center gap-2 group/user">
                    <div className="w-5 h-5 bg-gray-200 rounded-full overflow-hidden">
                      <img src={`https://i.pravatar.cc/150?u=${item.sellerId}`} alt="" className="w-full h-full object-cover"/>
                    </div>
                    <span className="text-xs text-gray-400 group-hover/user:text-gray-800 transition">
                      ID:{item.sellerId}
                    </span>
                  </Link>
                </div>
              </div>
            ));
          })()}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
};

// --- ルート内容 ---
function AppRoutes() {
  return (
    <Suspense fallback={<div className="p-6 text-center">読み込み中...</div>}>
      <Routes>
        {/* 認証ルート（保護なし） */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<ProtectedRoute><UserOnboarding /></ProtectedRoute>} />

        {/* 管理者ルート */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/item/:itemId" element={<AdminRoute><AdminItemDetail /></AdminRoute>} />
        <Route path="/admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />

        {/* 保護ルート */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/users/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><UserTransactions /></ProtectedRoute>} />
        <Route path="/sell" element={<ProtectedRoute><SellItem /></ProtectedRoute>} />
        <Route path="/create-listing" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
        <Route path="/purchase/:itemId" element={<ProtectedRoute><PurchaseItem /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><div className="p-6 text-center text-gray-600">会話を選択してください（URLに会話IDが必要です）</div></ProtectedRoute>} />
        <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}

// --- アプリ全体のルーティング定義 ---
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;


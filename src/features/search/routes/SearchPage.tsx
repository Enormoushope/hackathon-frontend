import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/axios';
import { CLASSIFICATION_TREE, type CategoryNode } from '@/features/items/types/classification';

type SearchResult = {
  users: { id: string; name: string; avatarUrl?: string; rating?: number }[];
  items: { id: string; name: string; price: number; imageUrl: string; sellerId?: string }[];
};

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<{ code: string; label: string }[]>([]);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Flatten category tree into a list with hierarchical labels
  const flattenCategories = (nodes: CategoryNode[], parentLabel = ''): { code: string; label: string }[] => {
    const result: { code: string; label: string }[] = [];
    
    for (const node of nodes) {
      const fullLabel = parentLabel ? `${parentLabel} > ${node.label}` : node.label;
      result.push({ code: node.code, label: fullLabel });
      
      if (node.children && node.children.length > 0) {
        result.push(...flattenCategories(node.children, fullLabel));
      }
    }
    
    return result;
  };

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await apiClient.get('/categories');
        if (res.data && Array.isArray(res.data)) {
          // If API returns tree structure, flatten it
          const flattened = flattenCategories(res.data);
          setCategories(flattened);
        } else {
          // Fallback to local CLASSIFICATION_TREE
          const flattened = flattenCategories(CLASSIFICATION_TREE);
          setCategories(flattened);
        }
      } catch (err) {
        console.error('Failed to load categories, using local tree:', err);
        // Fallback to local CLASSIFICATION_TREE
        const flattened = flattenCategories(CLASSIFICATION_TREE);
        setCategories(flattened);
      }
    };
    loadCategories();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      let url = `/search?q=${encodeURIComponent(query)}`;
      if (selectedCategory) {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      const res = await apiClient.get(url);
      setResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
      setResults({ users: [], items: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-500 font-bold">←</button>
        <h1 className="font-bold text-lg">検索</h1>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Search Input */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="ユーザ名・商品名で検索"
              className="flex-1 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? '検索中...' : '検索'}
            </button>
          </div>
          
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">カテゴリで絞り込む</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべてのカテゴリ</option>
              {categories.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {results && (
          <>
            {/* Users */}
            {results.users.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h2 className="font-bold text-lg mb-3">ユーザ ({results.users.length}件)</h2>
                <div className="space-y-2">
                  {results.users.map((u) => (
                    <Link key={u.id} to={`/users/${u.id}`} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                        <img src={u.avatarUrl ?? `https://i.pravatar.cc/100?u=${u.id}`} alt={u.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold">{u.name}</div>
                        <div className="text-xs text-gray-500">評価: ★{u.rating ?? '—'}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            {results.items.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h2 className="font-bold text-lg mb-3">商品 ({results.items.length}件)</h2>
                <div className="grid grid-cols-2 gap-3">
                  {results.items.map((it) => (
                    <Link key={it.id} to={`/items/${it.id}`} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                      <img src={it.imageUrl ?? `https://picsum.photos/seed/${it.id}/200/160`} alt={it.name} className="w-full h-24 object-cover" />
                      <div className="p-2">
                        <div className="font-bold text-sm line-clamp-2">{it.name}</div>
                        <div className="text-xs text-gray-600 mt-1">¥{it.price.toLocaleString()}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.users.length === 0 && results.items.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
                検索結果がありません。
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

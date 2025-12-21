import { useEffect, useState } from 'react';
import type { Item } from '../types';
import { getItems } from '../api/getItems';
import { ItemCard } from '../components/ItemCard';
import { ReactionButtons } from '@/components/Reactions/ReactionButtons';
import { CLASSIFICATION_TREE, type CategoryNode } from '@/features/items/types/classification';

export const ItemsRoute = () => {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  // Flatten category tree for filtering
  const flattenCategories = (nodes: CategoryNode[], prefix = ''): { code: string; label: string; level: number }[] => {
    let result: { code: string; label: string; level: number }[] = [];
    nodes.forEach((node) => {
      const level = prefix ? prefix.split(' > ').length : 0;
      const fullLabel = prefix ? `${prefix} > ${node.label}` : node.label;
      result.push({ code: node.code, label: fullLabel, level });
      if (node.children) {
        result = result.concat(flattenCategories(node.children, fullLabel));
      }
    });
    return result;
  };

  const categories = flattenCategories(CLASSIFICATION_TREE);

  // Map category labels to keywords for filtering
  const getCategoryKeywords = (categoryLabel: string): string[] => {
    const label = categoryLabel.split(' > ').pop() || '';
    const keywords: string[] = [label];
    
    // Add specific keywords for better matching
    const keywordMap: Record<string, string[]> = {
      'トレカ': ['トレーディングカード', 'トレカ'],
      'フィルムカメラ': ['カメラ', 'フィルムカメラ'],
      '技術書': ['技術書', '本'],
      'ゲーム機': ['ゲーム機', 'ゲーム'],
      'ヴィンテージ衣類': ['ヴィンテージ', '衣類'],
      'オーディオ': ['オーディオ'],
      'PC/ノート': ['PC', 'ノート'],
      '漫画コミック': ['漫画', 'コミック'],
      '腕時計': ['腕時計', '時計'],
      'スニーカー': ['スニーカー'],
      'アクセサリー': ['アクセサリー'],
      '楽器': ['楽器'],
      '美術品': ['美術品'],
      'アンティーク家具': ['アンティーク', '家具'],
      'フィギュア': ['フィギュア'],
      'レコード': ['レコード'],
    };
    
    Object.entries(keywordMap).forEach(([key, values]) => {
      if (label.includes(key)) {
        keywords.push(...values);
      }
    });
    
    return keywords;
  };

  useEffect(() => {
    // Get current user ID (fallback to test user)
    const userId = localStorage.getItem('userId') || '18oYncIdc3UuvZneYQQ4j2II23A2';
    setCurrentUserId(userId);

    // データ取得
    getItems().then((data) => {
      setAllItems(data);
      setItems(data);
      setLoading(false);
    });
  }, []);

  // Filter items when category changes
  useEffect(() => {
    if (selectedCategory === 'all') {
      setItems(allItems);
    } else {
      const categoryInfo = categories.find((c) => c.code === selectedCategory);
      if (!categoryInfo) {
        setItems(allItems);
        return;
      }
      
      const keywords = getCategoryKeywords(categoryInfo.label);
      
      // Filter by matching name with keywords
      const filtered = allItems.filter((item) => {
        return keywords.some(keyword => item.name && item.name.includes(keyword));
      });
      setItems(filtered);
    }
  }, [selectedCategory, allItems]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">新着アイテム</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCategoryFilter(!showCategoryFilter)}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition"
          >
            🏷️ カテゴリ絞り込み {selectedCategory !== 'all' && `(${items.length}件)`}
          </button>
          <p className="text-sm text-gray-500">注目の出品をピックアップ</p>
        </div>
      </div>

      {/* Category Filter Panel */}
      {showCategoryFilter && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">カテゴリで絞り込み</h3>
            <button
              onClick={() => setShowCategoryFilter(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`text-left px-4 py-2 rounded-lg transition ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              すべて ({allItems.length}件)
            </button>
            
            {categories.map((cat) => {
              const keywords = getCategoryKeywords(cat.label);
              const count = allItems.filter((item) => 
                keywords.some(keyword => item.name && item.name.includes(keyword))
              ).length;
              
              if (count === 0) return null;
              
              return (
                <button
                  key={cat.code}
                  onClick={() => {
                    setSelectedCategory(cat.code);
                    setShowCategoryFilter(false);
                  }}
                  className={`text-left px-4 py-2 rounded-lg transition ${
                    selectedCategory === cat.code
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={{ paddingLeft: `${cat.level * 1.5 + 1}rem` }}
                >
                  {cat.label.split(' > ').pop()} ({count}件)
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Filter Badge */}
      {selectedCategory !== 'all' && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">絞り込み中:</span>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
            {categories.find((c) => c.code === selectedCategory)?.label.split(' > ').pop()}
            <button
              onClick={() => setSelectedCategory('all')}
              className="hover:text-indigo-600"
            >
              ✕
            </button>
          </span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="p-8 text-center text-gray-500">現在、新着のアイテムはありません。</div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 flex gap-4 border">
              {/* Item card on left */}
              <div className="flex-shrink-0">
                <ItemCard item={item} />
              </div>
              
              {/* Reaction buttons on right */}
              <div className="flex-1 flex items-center justify-end">
                {currentUserId && <ReactionButtons itemId={item.id} userId={currentUserId} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import type { Item } from '@/features/items/types';
import { CLASSIFICATION_TREE, type CategoryNode } from '@/features/items/types/classification';

type Props = {
  item: Item;
};

// カテゴリコードからラベルを取得するヘルパー関数
const getCategoryLabel = (code: string | undefined): string => {
  if (!code) return '—';
  
  const findLabel = (nodes: CategoryNode[]): string | null => {
    for (const node of nodes) {
      if (node.code === code) return node.label;
      if (node.children) {
        const found = findLabel(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  
  return findLabel(CLASSIFICATION_TREE) || code;
};

export const ItemDetailCard = ({ item }: Props) => (
  <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
    <h3 className="font-bold">商品詳細</h3>
    <div className="text-sm text-gray-700 whitespace-pre-wrap">
      {item.description && item.description.trim().length > 0
        ? item.description
        : '商品説明が入力されていません。出品者へ質問できます。'}
    </div>
    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-2 border-t">
      <div>
        <span className="font-semibold">カテゴリ:</span> {getCategoryLabel(item.category)}
      </div>
      <div>
        <span className="font-semibold">商品の状態:</span> {item.condition || '—'}
      </div>
    </div>
  </div>
);

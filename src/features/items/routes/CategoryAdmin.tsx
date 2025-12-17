import { useState, useMemo } from 'react';
import { CLASSIFICATION_TREE, type CategoryNode } from '@/features/items/types/classification';

const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

const loadTree = (): CategoryNode[] => {
  try {
    const raw = localStorage.getItem('classificationTree');
    if (raw) return JSON.parse(raw);
  } catch {}
  return deepClone(CLASSIFICATION_TREE);
};

const saveTree = async (tree: CategoryNode[]) => {
  localStorage.setItem('classificationTree', JSON.stringify(tree));
  try {
    await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: tree }),
    });
  } catch {
    // ignore network errors for now
  }
};

export default function CategoryAdmin() {
  const [tree, setTree] = useState<CategoryNode[]>(loadTree());
  // Try fetch backend on mount to override local copy
  useState(() => {
    (async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setTree(data.categories);
          localStorage.setItem('classificationTree', JSON.stringify(data.categories));
        }
      } catch {}
    })();
  });
  const [selectedParentCode, setSelectedParentCode] = useState<string>(tree[0]?.code || '');
  const parent = useMemo(() => tree.find((n) => n.code === selectedParentCode) || tree[0], [tree, selectedParentCode]);

  const handleAddChild = () => {
    const code = prompt('新しい子コードを入力 (例: 224)');
    const label = prompt('ラベルを入力');
    if (!code || !label) return;
    const next = deepClone(tree);
    const p = next.find((n) => n.code === (parent?.code || ''));
    if (!p) return;
    p.children = p.children || [];
    p.children.push({ code, label });
    setTree(next);
    saveTree(next);
  };

  const handleEditNode = (node: CategoryNode, isParent = false) => {
    const label = prompt('新しいラベル', node.label);
    if (!label) return;
    const next = deepClone(tree);
    if (isParent) {
      const p = next.find((n) => n.code === node.code);
      if (!p) return;
      p.label = label;
    } else {
      const p = next.find((n) => n.code === parent?.code);
      const c = p?.children?.find((c) => c.code === node.code);
      if (!c) return;
      c.label = label;
    }
    setTree(next);
    saveTree(next);
  };

  const handleDeleteChild = (code: string) => {
    if (!confirm('この子分類を削除しますか？')) return;
    const next = deepClone(tree);
    const p = next.find((n) => n.code === parent?.code);
    if (!p || !p.children) return;
    p.children = p.children.filter((c) => c.code !== code);
    setTree(next);
    saveTree(next);
  };

  const handleAddParent = () => {
    const code = prompt('新しい親コード (例: D00)');
    const label = prompt('ラベル');
    if (!code || !label) return;
    const next = deepClone(tree);
    next.push({ code, label, children: [] });
    setTree(next);
    saveTree(next);
    setSelectedParentCode(code);
  };

  const handleDeleteParent = () => {
    if (!confirm('この親分類を削除しますか？')) return;
    const next = deepClone(tree).filter((n) => n.code !== parent?.code);
    setTree(next);
    saveTree(next);
    setSelectedParentCode(next[0]?.code || '');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">カテゴリ管理</h1>

      <div className="flex gap-2">
        <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={handleAddParent}>＋ 親分類追加</button>
        <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={handleDeleteParent}>削除（親）</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h2 className="font-bold">親分類</h2>
          <select
            className="w-full border rounded p-2"
            value={selectedParentCode}
            onChange={(e) => setSelectedParentCode(e.target.value)}
          >
            {tree.map((n) => (
              <option key={n.code} value={n.code}>{n.code} — {n.label}</option>
            ))}
          </select>
          {parent && (
            <div className="flex gap-2">
              <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => handleEditNode(parent, true)}>編集（親）</button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="font-bold">子分類</h2>
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={handleAddChild}>＋ 子分類追加</button>
          </div>
          <ul className="divide-y border rounded">
            {(parent?.children || []).map((c) => (
              <li key={c.code} className="p-2 flex justify-between items-center">
                <div>
                  <div className="font-mono text-sm">{c.code}</div>
                  <div>{c.label}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => handleEditNode(c)}>編集</button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => handleDeleteChild(c.code)}>削除</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-xs text-gray-600">
        変更はローカル保存（localStorage）されます。バックエンドAPI連携も追加可能です。
      </div>
    </div>
  );
}

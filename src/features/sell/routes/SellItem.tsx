import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const SellItem = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // 出品処理のシミュレーション
    setTimeout(() => {
      alert('出品が完了しました！');
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-500 font-bold">キャンセル</button>
        <h1 className="font-bold text-lg">商品の出品</h1>
        <button form="sell-form" disabled={isLoading} className="text-red-500 font-bold disabled:opacity-50">
          {isLoading ? '出品中...' : '出品する'}
        </button>
      </header>

      <main className="max-w-md mx-auto p-4">
        <form id="sell-form" onSubmit={handleSubmit} className="space-y-6">
          
          {/* 画像アップロード（ダミー） */}
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-200 transition">
            <span className="text-4xl">📷</span>
            <span className="text-sm font-bold mt-2">写真をアップロード</span>
            <span className="text-xs text-center mt-1 px-4">タップしてカメラを起動<br/>(デモ版です)</span>
          </div>

          {/* 商品情報入力 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">カテゴリー</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg bg-white">
                <option>トレーディングカード</option>
                <option>ゲーム・おもちゃ</option>
                <option>スニーカー</option>
                <option>ガジェット</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">商品名</label>
              <input type="text" placeholder="例：PSA10 ピカチュウ" className="w-full p-3 border border-gray-300 rounded-lg" required />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">商品の説明</label>
              <textarea placeholder="色、素材、重さ、定価、注意点など" rows={5} className="w-full p-3 border border-gray-300 rounded-lg"></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-1">販売価格 (¥)</label>
              <input type="number" placeholder="0" className="w-full p-3 border border-gray-300 rounded-lg text-xl" />
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
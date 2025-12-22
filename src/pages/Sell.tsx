import React, { useState } from 'react';

const Sell = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [base64Image, setBase64Image] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- 画像を圧縮してBase64に変換する関数 ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const result = (event.target as FileReader).result as string;
      const img = new Image();
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // ここでサイズを制限（1MB以下に抑えるコツ）
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = (MAX_WIDTH / width) * height;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // JPEG形式で品質を 0.7 (70%) に落として圧縮
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setBase64Image(compressedBase64);
        console.log("画像圧縮完了:", compressedBase64.length, "文字");
      };
    };
  };

  // --- AI商品説明生成 ---
  const generateDescription = async () => {
    if (!title) {
      alert("商品名を入力してください");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai/description`, { // あなたのAPIパスに合わせてください
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title,
          image_data: base64Image // ここで圧縮済みBase64を送る
        }),
      });
      const data = await response.json();
      if (data.description) {
        setDescription(data.description);
      }
    } catch (error) {
      console.error("生成エラー:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- 最終的な出品処理 ---
  const handleSubmit = async () => {
    const payload = {
      seller_id: 1, // 仮のID
      title,
      price: Number(price),
      description,
      image_url: base64Image, // DBのimage_urlカラムにBase64をそのまま保存
    };
    
    
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("出品しました！");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-blue-100 py-10 px-2 flex items-center justify-center">
      <form className="w-full max-w-lg mx-auto bg-white/90 rounded-3xl shadow-2xl p-8 space-y-7 border border-gray-100 backdrop-blur-md">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 drop-shadow mb-6 tracking-tight">新規出品</h2>

        {/* 画像選択 */}
        <div>
          <label className="block text-base font-bold mb-2 text-gray-700">商品画像</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 transition" />
          {base64Image && <img src={base64Image} alt="preview" className="w-32 h-32 object-cover rounded-2xl mt-3 border-4 border-pink-200 shadow-lg mx-auto" />}
        </div>

        {/* 商品名 + AI説明生成 */}
        <div className="space-y-2">
          <label className="block text-base font-bold text-gray-700">商品名</label>
          <div className="flex gap-2">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="flex-1 border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition shadow-sm bg-white/80" required />
            <button type="button" onClick={generateDescription} disabled={isGenerating}
              className="text-xs bg-gradient-to-r from-purple-500 to-pink-400 text-white px-5 py-2 rounded-full font-bold shadow-md hover:scale-105 transition disabled:bg-gray-300 disabled:scale-100">
              {isGenerating ? "生成中..." : "AIで説明"}
            </button>
          </div>
        </div>

        {/* 価格 */}
        <div className="space-y-2">
          <label className="block text-base font-bold text-gray-700">販売価格 (¥)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
            className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition shadow-sm bg-white/80" required />
        </div>

        {/* 商品説明 */}
        <div className="space-y-2">
          <label className="block text-base font-bold text-gray-700">商品説明</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5}
            className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition shadow-sm bg-white/80" />
        </div>

        <button type="button" onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition disabled:bg-gray-400 disabled:scale-100 mt-4">
          出品する
        </button>
      </form>
    </div>
  );
};

export default Sell;
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
      const response = await fetch('/api/ai/description', { // あなたのAPIパスに合わせてください
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
    
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("出品しました！");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>新規出品</h2>
      <div>
        <label>商品画像: </label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {base64Image && <img src={base64Image} alt="preview" style={{ width: '100px', display: 'block' }} />}
      </div>
      
      <div>
        <label>商品名: </label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button onClick={generateDescription} disabled={isGenerating}>
          {isGenerating ? "生成中..." : "AIに説明を書いてもらう"}
        </button>
      </div>

      <div>
        <label>価格: </label>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>

      <div>
        <label>商品説明: </label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} style={{ width: '100%' }} />
      </div>

      <button onClick={handleSubmit} style={{ marginTop: '20px', padding: '10px 20px' }}>出品する</button>
    </div>
  );
};

export default Sell;
import React, { useState } from 'react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Sell = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // フォーム状態
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // 処理状態
  const [uploading, setUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // ✨ エラーメッセージ保持用
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // エラーを解析して日本語にするヘルパー関数
  const getFriendlyErrorMessage = (err: any) => {
    if (err.response) {
      // サーバーからのレスポンスがある場合（400, 500など）
      const status = err.response.status;
      if (status === 401) return "ログインの有効期限が切れています。再ログインしてください。";
      if (status === 413) return "画像サイズが大きすぎます。";
      if (status >= 500) return "サーバー側で不具合が発生しました。時間を置いて試してください。";
      return err.response.data?.message || "入力内容に不備があります。";
    } else if (err.request) {
      // ネットワークエラー
      return "通信エラーが発生しました。インターネット接続を確認してください。";
    }
    return "予期せぬエラーが発生しました。";
  };

  const handleGenerateAIDescription = async () => {
    if (!title) return;
    setIsGenerating(true);
    setErrorMessage(null); // エラーをリセット
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/ai/generate-description`, {
        title: title
      });
      if (response.data.description) setDescription(response.data.description);
    } catch (err) {
      setErrorMessage("【AI生成失敗】" + getFriendlyErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // エラーをリセット
    
    if (!imageFile) return setErrorMessage("画像を選択してください。");
    
    setUploading(true);
    try {
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/products`, {
        seller_id: currentUser?.uid,
        title,
        description,
        price: Number(price),
        image_url: imageUrl
      });

      alert("出品完了！");
      navigate('/home');
    } catch (err) {
      console.error(err);
      setErrorMessage("【出品失敗】" + getFriendlyErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-blue-100 flex items-center justify-center py-10">
      <form onSubmit={handleSell} className="w-full max-w-lg mx-auto bg-white/90 rounded-3xl shadow-2xl p-8 space-y-7 border border-gray-100 backdrop-blur-md">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 drop-shadow mb-6 tracking-tight">商品を出品する</h1>

        {/* ✨ エラーメッセージ表示エリア */}
        {errorMessage && (
          <div className="bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-300 text-red-700 p-4 rounded-2xl text-base font-bold animate-pulse shadow-lg flex items-center gap-2">
            <span className="text-2xl">⚠️</span> {errorMessage}
          </div>
        )}

        {/* 画像選択 */}
        <div>
          <label className="block text-base font-bold mb-2 text-gray-700">商品画像</label>
          {previewUrl && <img src={previewUrl} className="w-full h-56 object-cover rounded-2xl mb-3 border-4 border-pink-200 shadow-lg transition-transform duration-300 hover:scale-105" alt="商品画像プレビュー" />}
          <input type="file" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setImageFile(file);
            setPreviewUrl(file ? URL.createObjectURL(file) : null);
          }} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 transition" />
        </div>

        {/* 商品名 */}
        <div className="space-y-2">
          <label className="block text-base font-bold text-gray-700">商品名</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition shadow-sm bg-white/80" required />
        </div>
        
        {/* 説明文 + AIボタン */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-base font-bold text-gray-700">商品の説明</label>
            <button type="button" onClick={handleGenerateAIDescription} disabled={isGenerating || !title}
              className="text-xs bg-gradient-to-r from-purple-500 to-pink-400 text-white px-5 py-2 rounded-full font-bold shadow-md hover:scale-105 transition disabled:bg-gray-300 disabled:scale-100">
              {isGenerating ? "生成中..." : "✨ AIで説明を作る"}
            </button>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full border-2 border-gray-200 p-3 rounded-xl h-40 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition shadow-sm bg-white/80" />
        </div>

        {/* 価格 */}
        <div className="space-y-2">
          <label className="block text-base font-bold text-gray-700">販売価格 (¥)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
            className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition shadow-sm bg-white/80" required />
        </div>

        <button type="submit" disabled={uploading}
          className="w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition disabled:bg-gray-400 disabled:scale-100">
          {uploading ? "処理中..." : "出品する"}
        </button>
      </form>
    </div>
  );
};

export default Sell;
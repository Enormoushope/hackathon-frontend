import React, { useState } from 'react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // 追加
import axios from 'axios';

const Sell = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate(); // 追加
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // プレビュー用
  const [uploading, setUploading] = useState(false);

  // 画像選択時の処理
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file)); // プレビューURLを生成
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return alert("画像を選択してください");
    if (!title || !price) return alert("商品名と価格を入力してください");
    
    setUploading(true);
    try {
      // 1. Firebase Storageにアップロード
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);

      // 2. バックエンドに送信
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/products`, {
        seller_id: currentUser?.uid, // バックエンド側のカラム名（owner_idなど）と一致しているか確認！
        title,
        description,
        price: Number(price),
        image_url: imageUrl
      });

      alert("出品完了！");
      navigate('/home'); // ホーム画面へ戻る
    } catch (err) {
      console.error(err);
      alert("出品に失敗しました。もう一度お試しください。");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSell} className="p-4 space-y-4 max-w-md mx-auto pb-20">
      <h1 className="text-xl font-bold border-b pb-2">商品を出品する</h1>
      
      {/* 画像選択とプレビュー */}
      <div>
        <label className="block text-sm font-medium mb-1">商品画像</label>
        {previewUrl && (
          <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded mb-2 border" />
        )}
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageChange}
          className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">商品名</label>
        <input 
          type="text" placeholder="例: スマートフォン" value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded focus:ring-2 focus:ring-red-500 outline-none"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">商品の説明</label>
        <textarea 
          placeholder="商品の状態などを詳しく書いてください" value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded h-32 focus:ring-2 focus:ring-red-500 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">販売価格</label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">¥</span>
          <input 
            type="number" placeholder="300" value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border p-2 pl-7 rounded focus:ring-2 focus:ring-red-500 outline-none"
            required
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={uploading}
        className={`w-full py-3 rounded font-bold text-white transition ${
          uploading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {uploading ? "アップロード中..." : "出品する"}
      </button>
      
      <button 
        type="button"
        onClick={() => navigate('/home')}
        className="w-full text-gray-500 text-sm py-2"
      >
        キャンセル
      </button>
    </form>
  );
};

export default Sell;
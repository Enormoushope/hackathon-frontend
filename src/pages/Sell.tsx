import React, { useState } from 'react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Sell = () => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null); // ファイル保持用
  const [uploading, setUploading] = useState(false);

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return alert("画像を選択してください");
    
    setUploading(true);
    try {
      // 1. Firebase Storageにアップロード
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);

      // 2. 取得したURLを含めてGoバックエンドに送信
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/products`, {
        seller_id: currentUser?.uid,
        title,
        description,
        price: Number(price),
        image_url: imageUrl // ここがURLになる
      });
      alert("出品完了！");
    } catch (err) {
      console.error(err);
      alert("出品に失敗しました");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSell} className="p-4 space-y-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold">商品を出品する</h1>
      
      {/* 画像選択 */}
      <div>
        <label className="block text-sm font-medium">商品画像</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="mt-1 block w-full text-sm"
        />
      </div>

      <input 
        type="text" placeholder="商品名" value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 rounded"
      />
      
      <textarea 
        placeholder="商品説明" value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border p-2 rounded h-32"
      />

      <input 
        type="number" placeholder="価格" value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <button 
        type="submit" 
        disabled={uploading}
        className="w-full bg-red-600 text-white py-3 rounded font-bold"
      >
        {uploading ? "アップロード中..." : "出品する"}
      </button>
    </form>
  );
};

export default Sell;
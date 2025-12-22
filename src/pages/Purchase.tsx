import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Purchase = () => {
  const { productId } = useParams();
  const { currentUser } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const fetchProduct = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/${productId}`);
    setProduct(res.data);
    const likeRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/likes/status`, {
      params: { user_id: currentUser?.uid, product_id: productId }
    });
    setIsLiked(likeRes.data.is_liked);
  };

  useEffect(() => { if(productId && currentUser) fetchProduct(); }, [productId, currentUser]);

  const handleToggleLike = async () => {
    const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/likes/toggle`, {
      user_id: currentUser?.uid, product_id: Number(productId)
    });
    setIsLiked(res.data.is_liked);
  };

  const handlePurchase = async () => {
    if (!window.confirm("購入しますか？")) return;
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/products/${productId}/purchase`);
    fetchProduct(); // 再取得してSOLDに更新
  };

  if (!product) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <nav className="mb-4 text-sm"><Link to="/" className="text-blue-500 underline">ホーム</Link> ＞ {product.title}</nav>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative">
          <img src={product.image_url} className="w-full rounded shadow" />
          {product.is_sold && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
              <span className="text-white text-5xl font-bold border-4 p-2 -rotate-12">SOLD</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <h1 className="text-2xl font-bold">{product.title}</h1>
            <button onClick={handleToggleLike} className="text-2xl">{isLiked ? '❤️' : '🤍'}</button>
          </div>
          <p className="text-3xl text-red-600 font-bold">¥{product.price.toLocaleString()}</p>
          
          <div className="bg-purple-50 p-4 rounded border border-purple-200">
            <button onClick={async () => {
              setLoadingAI(true);
              const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/ai/suggest-price`, { title: product.title, description: product.description });
              setAiAnalysis(res.data.suggestion);
              setLoadingAI(false);
            }} className="text-xs bg-purple-600 text-white px-2 py-1 rounded">AI価格査定</button>
            <p className="text-sm mt-2">{loadingAI ? "査定中..." : aiAnalysis}</p>
          </div>

          <div className="flex gap-2">
            {product.is_sold ? (
              <button disabled className="flex-1 bg-gray-400 py-3 rounded text-white font-bold">SOLD OUT</button>
            ) : (
              <button onClick={handlePurchase} className="flex-1 bg-red-600 py-3 rounded text-white font-bold">購入する</button>
            )}
            <Link to={`/chat/${product.id}?receiver=${product.seller_id}`} className="bg-gray-200 px-4 py-3 rounded">質問</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Purchase;
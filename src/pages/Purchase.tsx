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

  if (!product) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-white to-blue-100"><div className="text-xl font-bold animate-pulse">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-blue-100 py-10 px-2 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto bg-white/90 rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100 backdrop-blur-md">
        <nav className="mb-6 text-sm font-semibold text-gray-500"><Link to="/home" className="text-blue-500 underline hover:text-blue-700 transition">ホーム</Link> <span className="mx-2">＞</span> {product.title}</nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="relative">
            <img src={product.image_url} className="w-full h-80 object-cover rounded-2xl shadow-xl border-4 border-pink-100" alt="商品画像" />
            {product.is_sold && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                <span className="text-white text-6xl md:text-7xl font-extrabold border-4 border-white px-8 py-2 -rotate-12 shadow-2xl tracking-widest">SOLD</span>
              </div>
            )}
          </div>

          <div className="space-y-6 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow">{product.title}</h1>
              <button onClick={handleToggleLike} className="text-3xl md:text-4xl transition hover:scale-125 duration-200">{isLiked ? '❤️' : '🤍'}</button>
            </div>
            <p className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 font-extrabold drop-shadow">¥{product.price.toLocaleString()}</p>

            <div className="bg-gradient-to-r from-purple-100 to-pink-50 p-5 rounded-2xl border-2 border-purple-200 shadow flex flex-col gap-2">
              <button onClick={async () => {
                setLoadingAI(true);
                const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/ai/suggest-price`, { title: product.title, description: product.description });
                setAiAnalysis(res.data.suggestion);
                setLoadingAI(false);
              }} className="text-xs bg-gradient-to-r from-purple-500 to-pink-400 text-white px-4 py-2 rounded-full font-bold shadow hover:scale-105 transition disabled:bg-gray-300 disabled:scale-100">
                AI価格査定
              </button>
              <p className="text-sm mt-1 min-h-[1.5em]">{loadingAI ? <span className="animate-pulse text-gray-400">査定中...</span> : aiAnalysis}</p>
            </div>

            {/* 商品説明欄 */}
            <div className="bg-white/80 border-2 border-pink-100 rounded-2xl p-5 shadow-inner">
              <h2 className="text-base font-bold text-pink-600 mb-2">商品説明</h2>
              <p className="text-gray-700 whitespace-pre-line break-words">{product.description}</p>
            </div>

            <div className="flex gap-3 mt-4">
              {product.seller_id === currentUser?.uid ? (
                <div className="flex-1 bg-yellow-100 py-4 rounded-2xl text-yellow-700 font-black text-lg shadow-xl flex flex-col items-center justify-center border-2 border-yellow-300">
                  <div>自分の商品です</div>
                  <div className="mt-2 text-sm text-yellow-700 font-semibold flex items-center gap-1">
                    <span className="text-xl">❤️</span> {product.like_count ?? 0} いいね
                  </div>
                </div>
              ) : product.is_sold ? (
                <button disabled className="flex-1 bg-gray-400 py-4 rounded-2xl text-white font-black text-lg shadow-xl cursor-not-allowed">SOLD OUT</button>
              ) : (
                <button onClick={handlePurchase} className="flex-1 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400 py-4 rounded-2xl text-white font-black text-lg shadow-xl hover:scale-105 transition">購入する</button>
              )}
              {product.seller_id !== currentUser?.uid && (
                <Link to={`/chat/${product.id}?receiver=${product.seller_id}`} className="bg-gray-100 px-6 py-4 rounded-2xl font-bold text-gray-700 shadow hover:bg-gray-200 transition flex items-center">質問</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Purchase;
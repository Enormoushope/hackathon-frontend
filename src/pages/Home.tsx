import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // useNavigateを追加
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // ログイン状態確認用

const Home = () => {
  const [products, setProducts] = useState<any[]>([]); // 型定義と初期化
  const [loading, setLoading] = useState(true);      // ローディング状態
  const { currentUser } = useAuth();                  // 現在のログイン状態
  const navigate = useNavigate();

  useEffect(() => {
    const url = import.meta.env.VITE_API_BASE_URL;
    console.log("Fetching from:", `${url}/api/products`);

    axios.get(`${url}/api/products`)
      .then(res => {
        // データが配列であることを確認してセット
        setProducts(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("API Error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-white to-blue-100"><div className="text-xl font-bold animate-pulse">データを読み込み中...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-blue-100 py-10 px-2 flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto mb-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 drop-shadow tracking-tight">新着アイテム</h1>
          <div className="flex items-center gap-4">
            <Link to="/profile" className="text-pink-600 font-bold hover:underline">マイページ</Link>
            <button 
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-pink-500 to-yellow-400 text-white px-6 py-2 rounded-full text-sm font-extrabold shadow-lg hover:scale-105 transition"
            >
              {currentUser ? "アカウント切替" : "ログイン"}
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center text-gray-400 text-lg font-bold py-20">出品されている商品がありません。</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {products.map((p: any) => (
              <Link to={`/purchase/${p.id}`} key={p.id} className="relative group border-2 border-pink-100 rounded-2xl overflow-hidden shadow-lg bg-white/90 hover:scale-[1.03] transition-all duration-200">
                <img src={p.image_url} className="w-full h-44 object-cover rounded-t-2xl group-hover:brightness-90 transition" alt={p.title} />
                {p.is_sold && <div className="absolute top-2 left-2 bg-red-600/90 text-white text-xs px-3 py-1 font-extrabold rounded-full shadow">SOLD</div>}
                <div className="p-4">
                  <div className="font-extrabold truncate text-base text-gray-800 mb-1">{p.title}</div>
                  <div className="text-2xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400 bg-clip-text text-transparent font-black drop-shadow">¥{p.price?.toLocaleString() ?? "0"}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
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

  if (loading) return <div className="p-8 text-center">データを読み込み中...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">新着アイテム</h1>
        <div className="flex items-center gap-4">
          <Link to="/profile" className="text-blue-500">マイページ</Link>
          
          {/* 常にアカウント切替/ログインができるボタンを追加 */}
          <button 
            onClick={() => navigate('/login')}
            className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold shadow-sm hover:bg-gray-700 transition"
          >
            {currentUser ? "アカウント切替" : "ログイン"}
          </button>
        </div>
      </div>
      
      {products.length === 0 ? (
        <p>出品されている商品がありません。</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p: any) => (
            <Link to={`/purchase/${p.id}`} key={p.id} className="relative border rounded overflow-hidden shadow-sm">
              <img src={p.image_url} className="w-full h-40 object-cover" alt={p.title} />
              {p.is_sold && <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] px-2 py-1 font-bold">SOLD</div>}
              <div className="p-2">
                <div className="font-bold truncate text-sm">{p.title}</div>
                {/* 🔴 安全に表示するための修正 (Optional Chaining) */}
                <div className="text-red-600 font-bold">
                  ¥{p.price?.toLocaleString() ?? "0"} 
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
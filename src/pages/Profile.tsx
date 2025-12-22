import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'selling' | 'liked' | 'messages'>('selling');

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/users/${currentUser?.uid}/profile`);
      setData(res.data);
    };
    if (currentUser) fetchProfile();
  }, [currentUser]);

  if (!data) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-white to-blue-100"><div className="text-xl font-bold animate-pulse">読み込み中...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-blue-100 py-10 px-2 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto bg-white/90 rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100 backdrop-blur-md">
        {/* ユーザー基本情報 & ナビゲーションハブ */}
        <div className="bg-gradient-to-r from-pink-100 to-blue-100 shadow-lg rounded-2xl p-8 mb-8 border border-gray-200">
          <div className="flex items-center gap-6 mb-6">
            <img src={data.user.avatar_url || 'https://via.placeholder.com/80'} className="w-24 h-24 rounded-full border-4 border-pink-200 shadow-lg" alt="avatar" />
            <div>
              <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight drop-shadow">{data.user.name}</h1>
              <p className="text-gray-500 font-medium">{data.user.email}</p>
            </div>
            <button onClick={logout} className="ml-auto text-sm text-red-500 border-2 border-red-400 px-4 py-2 rounded-full font-bold hover:bg-red-50 transition">ログアウト</button>
          </div>
          {/* 全画面へのクイックリンク */}
          <div className="flex gap-3 border-t pt-4">
            <Link to="/" className="flex-1 text-center bg-gray-100 py-3 rounded-xl font-bold hover:bg-gray-200 transition">ホーム</Link>
            <Link to="/sell" className="flex-1 text-center bg-gradient-to-r from-pink-500 to-yellow-400 text-white py-3 rounded-xl font-bold shadow hover:scale-105 transition">出品する</Link>
          </div>
        </div>

        {/* タブ切り替え */}
        <div className="flex border-b-2 border-gray-200 mb-6">
          {['selling', 'liked', 'messages'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-4 font-extrabold text-lg transition border-b-4 ${activeTab === tab ? 'border-pink-400 text-pink-600 bg-pink-50 shadow' : 'border-transparent text-gray-400 hover:text-pink-400 hover:bg-pink-50'}`}
            >
              {tab === 'selling' ? '出品中' : tab === 'liked' ? 'いいね' : 'メッセージ'}
            </button>
          ))}
        </div>

        {/* コンテンツ表示エリア */}
        <div className="space-y-5">
          {activeTab === 'selling' && data.selling_products?.map((p: any) => (
            <div key={p.id} className="flex gap-5 p-4 border-2 border-pink-100 rounded-2xl items-center bg-white shadow hover:scale-[1.02] transition">
              <img src={p.image_url} className="w-20 h-20 object-cover rounded-xl border-2 border-pink-200 shadow" alt="product" />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">{p.title}</h3>
                <p className="text-base text-red-500 font-bold">¥{p.price}</p>
              </div>
              <div className="flex flex-col items-center justify-center min-w-[90px]">
                <span className="text-xl">❤️</span>
                <span className="text-yellow-700 font-semibold text-sm">{p.like_count ?? 0} いいね</span>
              </div>
            </div>
          ))}

          {activeTab === 'liked' && data.liked_products?.map((p: any) => (
            <div key={p.id} className="flex gap-5 p-4 border-2 border-yellow-100 rounded-2xl items-center bg-white shadow hover:scale-[1.02] transition">
              <img src={p.image_url} className="w-20 h-20 object-cover rounded-xl border-2 border-yellow-200 shadow" alt="liked" />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">{p.title}</h3>
              </div>
              <Link to={`/purchase/${p.id}`} className="bg-gradient-to-r from-orange-400 to-yellow-400 text-white px-5 py-2 rounded-xl text-sm font-bold shadow hover:scale-105 transition">購入へ</Link>
            </div>
          ))}

          {activeTab === 'messages' && data.latest_messages?.map((m: any) => (
            <div key={m.id} className="p-4 border-2 border-gray-100 rounded-2xl bg-white shadow hover:bg-gray-50 cursor-pointer transition">
              <Link to={`/chat/${m.product_id}`} className="block">
                <p className="text-xs text-gray-400 mb-1">商品ID: {m.product_id} に関する相談</p>
                <p className="font-medium text-gray-800">{m.content}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
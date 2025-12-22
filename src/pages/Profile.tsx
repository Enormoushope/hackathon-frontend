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

  if (!data) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* ユーザー基本情報 & ナビゲーションハブ */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <img src={data.user.avatar_url || "https://via.placeholder.com/80"} className="w-20 h-20 rounded-full border" />
          <div>
            <h1 className="text-2xl font-bold">{data.user.name}</h1>
            <p className="text-gray-500">{data.user.email}</p>
          </div>
          <button onClick={logout} className="ml-auto text-sm text-red-500 border border-red-500 px-3 py-1 rounded">ログアウト</button>
        </div>
        
        {/* 全画面へのクイックリンク */}
        <div className="flex gap-2 border-t pt-4">
          <Link to="/" className="flex-1 text-center bg-gray-100 py-2 rounded hover:bg-gray-200">ホーム</Link>
          <Link to="/sell" className="flex-1 text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700">出品する</Link>
        </div>
      </div>

      {/* タブ切り替え */}
      <div className="flex border-b mb-4">
        {['selling', 'liked', 'messages'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 font-bold ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            {tab === 'selling' ? '出品中' : tab === 'liked' ? 'いいね' : 'メッセージ'}
          </button>
        ))}
      </div>

      {/* コンテンツ表示エリア */}
      <div className="space-y-4">
        {activeTab === 'selling' && data.selling_products?.map((p: any) => (
          <div key={p.id} className="flex gap-4 p-3 border rounded items-center bg-white">
            <img src={p.image_url} className="w-16 h-16 object-cover rounded" />
            <div className="flex-1">
              <h3 className="font-bold">{p.title}</h3>
              <p className="text-sm text-red-500">¥{p.price}</p>
            </div>
            {/* この商品に紐づくDMを確認するボタン */}
            <Link to={`/chat/${p.id}`} className="text-blue-600 text-sm font-bold">DMを見る</Link>
          </div>
        ))}

        {activeTab === 'liked' && data.liked_products?.map((p: any) => (
          <div key={p.id} className="flex gap-4 p-3 border rounded items-center bg-white">
            <img src={p.image_url} className="w-16 h-16 object-cover rounded" />
            <div className="flex-1">
              <h3 className="font-bold">{p.title}</h3>
            </div>
            <Link to={`/purchase/${p.id}`} className="bg-orange-500 text-white px-3 py-1 rounded text-sm">購入へ</Link>
          </div>
        ))}

        {activeTab === 'messages' && data.latest_messages?.map((m: any) => (
          <div key={m.id} className="p-3 border rounded bg-white hover:bg-gray-50 cursor-pointer">
            <Link to={`/chat/${m.product_id}`} className="block">
              <p className="text-xs text-gray-400">商品ID: {m.product_id} に関する相談</p>
              <p className="font-medium text-gray-800">{m.content}</p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;
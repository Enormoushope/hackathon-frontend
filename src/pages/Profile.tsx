import React, { useEffect, useState } from 'react';
// DM一覧タブ用サブコンポーネント
const MessagesTab = ({ latestMessages, sellingProducts, likedProducts }: { latestMessages: any[]; sellingProducts: any[]; likedProducts: any[] }) => {
  const [partnerNameMap, setPartnerNameMap] = useState<{ [uid: string]: string }>({});
  useEffect(() => {
    const fetchNames = async () => {
      const ids = Array.from(new Set(latestMessages?.map((m: any) => m.partner_id).filter(Boolean)));
      const newMap: { [uid: string]: string } = { ...partnerNameMap };
      for (const uid of ids) {
        if (!uid || newMap[uid]) continue;
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/users/${uid}`);
          newMap[uid] = res.data?.name || uid;
        } catch {
          newMap[uid] = uid;
        }
      }
      setPartnerNameMap(newMap);
    };
    fetchNames();
    // eslint-disable-next-line
  }, [latestMessages]);
  // 商品IDと相手IDごとにまとめる
  const grouped: { [key: string]: any[] } = {};
  latestMessages?.forEach((m: any) => {
    const key = `${m.product_id}_${m.partner_id}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });
  // 商品情報がなければAPIで個別取得して補完
  const [productInfoMap, setProductInfoMap] = useState<{ [id: number]: any }>({});
  useEffect(() => {
    const fetchMissingProducts = async () => {
      const ids = Array.from(new Set(latestMessages?.map((m: any) => m.product_id)));
      for (const id of ids) {
        if (
          productInfoMap[id] ||
          sellingProducts?.some((p: any) => p.id === id) ||
          likedProducts?.some((p: any) => p.id === id)
        ) continue;
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`);
          setProductInfoMap(prev => ({ ...prev, [id]: res.data }));
        } catch {}
      }
    };
    fetchMissingProducts();
    // eslint-disable-next-line
  }, [latestMessages, sellingProducts, likedProducts]);

  return (
    <>
      {Object.entries(grouped).map(([key, msgs]) => {
        const m = msgs[0]; // 代表メッセージ
        let product = sellingProducts?.find((p: any) => p.id === m.product_id) || likedProducts?.find((p: any) => p.id === m.product_id);
        let productInfo = productInfoMap[m.product_id] || {};
        if (!product) product = productInfo;
        // 画像はAPI補完分があればそちらを優先
        const imageUrl = productInfo.image_url || product.image_url || 'https://via.placeholder.com/80';
        return (
          <div key={key} className="flex gap-5 p-4 border-2 border-gray-100 rounded-2xl bg-white shadow hover:bg-gray-50 cursor-pointer transition items-center">
            <img src={imageUrl} className="w-16 h-16 object-cover rounded-xl border-2 border-pink-100 shadow" alt="product" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base text-gray-800 truncate">{product.title || `商品ID: ${m.product_id}`}</h3>
              <p className="text-xs text-gray-400 mb-1 truncate">{msgs.length}件のやりとり</p>
              <p className="text-xs text-blue-500 font-bold">相手: {partnerNameMap[m.partner_id] || m.partner_id}</p>
            </div>
            <Link to={`/chat/${m.product_id}?receiver=${m.partner_id}`} className="bg-gradient-to-r from-pink-400 to-yellow-300 text-white px-4 py-2 rounded-xl text-sm font-bold shadow hover:scale-105 transition whitespace-nowrap">DMへ</Link>
          </div>
        );
      })}
    </>
  );
};
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
            <Link to="/home" className="flex-1 text-center bg-gray-100 py-3 rounded-xl font-bold hover:bg-gray-200 transition">ホーム</Link>
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
            <div key={p.id} className={`flex gap-5 p-4 border-2 rounded-2xl items-center bg-white shadow hover:scale-[1.02] transition ${p.is_sold ? 'border-gray-300 opacity-60' : 'border-pink-100'}`}>
              <img src={p.image_url} className={`w-20 h-20 object-cover rounded-xl border-2 shadow ${p.is_sold ? 'border-gray-300' : 'border-pink-200'}`} alt="product" />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  {p.title}
                  {p.is_sold && <span className="bg-gray-400 text-white text-xs font-bold px-2 py-1 rounded ml-2">売り切れ</span>}
                </h3>
                <p className={`text-base font-bold ${p.is_sold ? 'text-gray-400 line-through' : 'text-red-500'}`}>¥{p.price}</p>
              </div>
              <div className="flex flex-col items-center justify-center min-w-[90px]">
                <span className="text-xl">❤️</span>
                <span className="text-yellow-700 font-semibold text-sm">{p.like_count ?? 0} いいね</span>
              </div>
            </div>
          ))}

          {activeTab === 'liked' && data.liked_products?.map((p: any) => (
            <div key={p.id} className={`flex gap-5 p-4 border-2 rounded-2xl items-center bg-white shadow hover:scale-[1.02] transition ${p.is_sold ? 'border-gray-300 opacity-60' : 'border-yellow-100'}`}>
              <img src={p.image_url} className={`w-20 h-20 object-cover rounded-xl border-2 shadow ${p.is_sold ? 'border-gray-300' : 'border-yellow-200'}`} alt="liked" />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  {p.title}
                  {p.is_sold && <span className="bg-gray-400 text-white text-xs font-bold px-2 py-1 rounded ml-2">売り切れ</span>}
                </h3>
              </div>
              {!p.is_sold && (
                <Link to={`/purchase/${p.id}`} className="bg-gradient-to-r from-orange-400 to-yellow-400 text-white px-5 py-2 rounded-xl text-sm font-bold shadow hover:scale-105 transition">購入へ</Link>
              )}
            </div>
          ))}

          {activeTab === 'messages' && (
            <MessagesTab
              latestMessages={data.latest_messages}
              sellingProducts={data.selling_products}
              likedProducts={data.liked_products}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
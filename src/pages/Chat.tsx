import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface Message {
  id: number;
  sender_id: string;
  content: string;
  created_at: string;
}

const Chat = () => {
  const { productId } = useParams(); // 商品ID
  const [searchParams] = useSearchParams();
  const receiverId = searchParams.get('receiver'); // 相手のUID
  
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);

  // デバッグ用: 受信データやIDを可視化
  useEffect(() => {
    console.log('[messages]', messages);
    console.log('[currentUser?.uid]', currentUser?.uid);
    console.log('[receiverId]', receiverId);
    console.log('[productId]', productId);
  }, [messages, currentUser?.uid, receiverId, productId]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 履歴の取得
  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/messages`, {
        params: {
          product_id: productId,
          user1: currentUser?.uid,
          user2: receiverId
        }
      });
      // nullや配列以外が返ってきても空配列として扱う
      if (!res.data) {
        setMessages([]);
      } else if (Array.isArray(res.data)) {
        setMessages(res.data);
      } else {
        // オブジェクトやその他の場合も空配列
        setMessages([]);
      }
    } catch (err: any) {
      let msg = '[チャット履歴取得エラー] ';
      if (err.response) {
        msg += `サーバー応答エラー: ${err.response.status} ${err.response.statusText}\n`;
        if (err.response.data && err.response.data.error) {
          msg += `詳細: ${err.response.data.error}`;
        }
      } else if (err.request) {
        msg += 'サーバーに接続できませんでした。通信環境をご確認ください。';
      } else if (err instanceof Error) {
        msg += err.message;
      } else {
        msg += String(err);
      }
      console.error(msg, err);
      alert(msg);
    }
  };

  useEffect(() => {
    if (productId && receiverId && currentUser?.uid) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line
  }, [productId, receiverId, currentUser?.uid]);

  // メッセージ送信
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const payload = {
        product_id: Number(productId),
        sender_id: currentUser?.uid,
        receiver_id: receiverId,
        content: newMessage
      };
      console.log('[送信payload]', payload);
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/messages`, payload);
      setNewMessage('');
      fetchMessages();
    } catch (err: any) {
      let msg = '[メッセージ送信エラー] ';
      if (err.response) {
        msg += `サーバー応答エラー: ${err.response.status} ${err.response.statusText}\n`;
        if (err.response.data && err.response.data.error) {
          msg += `詳細: ${err.response.data.error}`;
        }
      } else if (err.request) {
        msg += 'サーバーに接続できませんでした。通信環境をご確認ください。';
      } else if (err instanceof Error) {
        msg += err.message;
      } else {
        msg += String(err);
      }
      console.error(msg, err);
      alert(msg);
    }
  };

  // 新しいメッセージが来たら一番下へスクロール
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen flex flex-col h-screen max-w-2xl mx-auto bg-gradient-to-br from-pink-100 via-white to-blue-100">
      {/* ヘッダー */}
      <div className="p-4 border-b-2 border-pink-200 bg-white/90 flex items-center justify-between rounded-t-3xl shadow-md">
        <Link to="/profile" className="text-pink-500 font-bold hover:underline">← 戻る</Link>
        <h1 className="font-extrabold text-lg text-gray-700 tracking-tight drop-shadow">チャットルーム</h1>
        <Link to={`/purchase/${productId}`} className="text-xs bg-gradient-to-r from-pink-200 to-yellow-100 px-3 py-1 rounded-full font-bold text-pink-700 shadow hover:scale-105 transition">商品詳細</Link>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/60 backdrop-blur rounded-b-3xl shadow-inner">
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex ${m.sender_id === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-3xl shadow-md text-base break-words transition-all duration-200 ${
              m.sender_id === currentUser?.uid 
                ? 'bg-gradient-to-r from-pink-400 to-yellow-300 text-white rounded-tr-none border-2 border-pink-200 animate-in fade-in slide-in-from-right-8' 
                : 'bg-white text-gray-800 rounded-tl-none border-2 border-blue-100 animate-in fade-in slide-in-from-left-8'
            }`}>
              <p className="text-base font-medium">{m.content}</p>
              <p className={`text-[10px] mt-2 text-right ${m.sender_id === currentUser?.uid ? 'text-yellow-100' : 'text-blue-400'}`}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* 送信フォーム */}
      <form onSubmit={handleSend} className="p-5 bg-white/90 border-t-2 border-pink-200 flex gap-3 rounded-b-3xl shadow-md">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 border-2 border-pink-200 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white/80 shadow-sm text-base"
        />
        <button 
          type="submit" 
          className="bg-gradient-to-r from-pink-500 to-yellow-400 text-white p-3 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold shadow-lg hover:scale-110 transition-all duration-150"
        >
          ✈️
        </button>
      </form>
    </div>
  );
};

export default Chat;
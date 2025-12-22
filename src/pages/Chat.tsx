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
      setMessages(res.data || []);
    } catch (err) {
      console.error("メッセージ取得失敗", err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // 3秒ごとに自動更新（簡易ポーリング）
    return () => clearInterval(interval);
  }, [productId, receiverId]);

  // メッセージ送信
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/messages`, {
        product_id: Number(productId),
        sender_id: currentUser?.uid,
        receiver_id: receiverId,
        content: newMessage
      });
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      alert("送信に失敗しました");
    }
  };

  // 新しいメッセージが来たら一番下へスクロール
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gray-50">
      {/* ヘッダー */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <Link to="/profile" className="text-blue-600">← 戻る</Link>
        <h1 className="font-bold text-lg">チャットルーム</h1>
        <Link to={`/purchase/${productId}`} className="text-xs bg-gray-200 px-2 py-1 rounded">商品詳細</Link>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex ${m.sender_id === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
              m.sender_id === currentUser?.uid 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 rounded-tl-none border'
            }`}>
              <p className="text-sm">{m.content}</p>
              <p className={`text-[10px] mt-1 ${m.sender_id === currentUser?.uid ? 'text-blue-100' : 'text-gray-400'}`}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* 送信フォーム */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          type="submit" 
          className="bg-blue-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue-700"
        >
          ✈️
        </button>
      </form>
    </div>
  );
};

export default Chat;
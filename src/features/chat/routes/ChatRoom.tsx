import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getConversation, getMessages, sendMessage } from '../api/chatApi';
import { getItemById } from '@/features/items/api/getItems';
import { getSellerById } from '@/features/users/api/getSellers';
import type { Message } from '../types';
import type { Item } from '@/features/items/types';
import type { Seller } from '@/features/users/types';

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊',
  '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋',
  '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
  '👍', '👎', '👌', '✌️', '🤞', '🤝', '🙏', '👏', '💪', '🎉',
  '🎊', '🎁', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '💯', '✨', '⭐', '🌟', '💫', '🔥', '💥', '🎈', '🎀', '🏆',
];

export const ChatRoom = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [item, setItem] = useState<Item | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = '101'; // TODO: Get from auth context

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!conversationId) return;
      setLoading(true);
      
      const conv = await getConversation(conversationId);
      if (!conv) {
        setLoading(false);
        return;
      }
      
      const [msgs, itemData, sellerData] = await Promise.all([
        getMessages(conversationId),
        getItemById(conv.itemId),
        getSellerById(conv.sellerId),
      ]);
      
      if (mounted) {
        setMessages(Array.isArray(msgs) ? msgs : []);
        setItem(itemData);
        setSeller(sellerData);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId || sending) return;
    
    setSending(true);
    const msg = await sendMessage(conversationId, currentUserId, newMessage.trim());
    if (msg) {
      setMessages([...messages, msg]);
      setNewMessage('');
      setShowEmojiPicker(false);
    }
    setSending(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  const handlePurchase = () => {
    if (item) {
      navigate(`/purchase/${item.id}`);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  if (!item || !seller) {
    return <div className="p-8 text-center text-gray-500">会話が見つかりません</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
          >
            ← 戻る
          </button>
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-10 h-10 object-cover rounded"
          />
          <div>
            <h2 className="font-semibold text-sm">{item.title}</h2>
            <p className="text-xs text-gray-500">
              出品者: <Link to={`/users/${seller.id}`} className="text-indigo-600 hover:underline">{seller.name}</Link>
            </p>
          </div>
        </div>
        <button
          onClick={handlePurchase}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
        >
          購入画面へ
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(Array.isArray(messages) ? messages : []).map((msg) => {
          const isCurrentUser = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  isCurrentUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    isCurrentUser ? 'text-blue-200' : 'text-gray-500'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">絵文字を選択</span>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-10 gap-2">
              {EMOJI_LIST.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-2xl hover:bg-gray-200 rounded p-1 transition"
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg transition text-xl"
            type="button"
          >
            😀
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="メッセージを入力..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
};

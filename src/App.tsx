import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Sell from './pages/Sell';
import Purchase from './pages/Purchase';
import Chat from './pages/Chat';

// 認証が必要なページを保護するコンポーネント
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div className="p-8 text-center">読み込み中...</div>;
  
  // ログインしていなければログイン画面へ
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 【重要】一番最初のアクセス（/）をログイン画面（/login）へリダイレクト */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ログイン画面（ここが入り口になります） */}
        <Route path="/login" element={<Login />} />

        {/* ログイン後に利用できるメイン画面（Homeを保護下に置く） */}
        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
        
        {/* その他のログイン必須ページ */}
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/sell" element={<PrivateRoute><Sell /></PrivateRoute>} />
        <Route path="/purchase/:productId" element={<PrivateRoute><Purchase /></PrivateRoute>} />
        <Route path="/chat/:productId" element={<PrivateRoute><Chat /></PrivateRoute>} />

        {/* 存在しないパスへのアクセスはすべてトップ（結果的にログイン）へ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
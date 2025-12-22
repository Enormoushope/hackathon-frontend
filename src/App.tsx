import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Sell from './pages/Sell';
import Purchase from './pages/Purchase';
import Chat from './pages/Chat';

// ログインしていないと入れないようにするガード
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">読み込み中...</div>;
  // ログインしてなければ /login へリダイレクト
  return currentUser ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 誰でもアクセス可能 */}
        <Route path="/login" element={<Login />} />

        {/* ログイン必須の画面 */}
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/sell" element={<PrivateRoute><Sell /></PrivateRoute>} />
        {/* :productId は動的なIDを受け取る設定 */}
        <Route path="/purchase/:productId" element={<PrivateRoute><Purchase /></PrivateRoute>} />
        <Route path="/chat/:productId" element={<PrivateRoute><Chat /></PrivateRoute>} />

        {/* それ以外はホームへ飛ばす */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
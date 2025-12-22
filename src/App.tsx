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
  console.log("App.tsx が読み込まれました"); // ← これを追加

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. 一時的にガードを外して Home を一番上に置く */}
        <Route path="/" element={<Home />} /> 
        
        {/* 2. ログイン画面もガードなしで置く */}
        <Route path="/login" element={<Login />} />

        {/* 既存のルートは一旦そのままでもOK */}
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        {/* ... */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
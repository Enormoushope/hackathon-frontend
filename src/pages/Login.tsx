import React from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // 1. FirebaseでGoogleログイン
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 2. バックエンドにユーザー情報を同期 (DBに保存)
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/users/sync`, {
        id: user.uid,
        name: user.displayName,
        email: user.email,
        avatar_url: user.photoURL
      });

      // 3. ホーム画面へ
      navigate('/home');
    } catch (error) {
      console.error("Login Error:", error);
      alert("ログインに失敗しました");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="p-10 bg-white rounded-2xl shadow-xl text-center">
        <h1 className="text-3xl font-black mb-2 text-red-600">Gemini Marketplace</h1>
        <p className="text-gray-500 mb-8 text-sm">AIが査定する次世代フリマアプリ</p>
        
        <button
          onClick={handleGoogleLogin}
          className="flex items-center gap-4 bg-white border border-gray-300 px-6 py-3 rounded-full font-bold hover:bg-gray-50 transition shadow-sm"
        >
          <img src="https://www.gstatic.com/firebase/static/bin/api/img/google.png" alt="Google" className="w-5 h-5" />
          Googleでログイン
        </button>

        <p className="mt-8 text-[10px] text-gray-400">
          ログインすることで利用規約に同意したことになります
        </p>
      </div>
    </div>
  );
};

export default Login;
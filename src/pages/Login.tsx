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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-white to-blue-100">
      <div className="w-full max-w-md p-10 bg-white/90 rounded-3xl shadow-2xl text-center border border-gray-100 backdrop-blur-md">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 drop-shadow tracking-tight">Gemini Marketplace</h1>
        <p className="text-gray-500 mb-10 text-base font-medium">AIが査定する次世代フリマアプリ</p>

        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-4 bg-gradient-to-r from-white to-pink-50 border-2 border-pink-200 px-8 py-4 rounded-full font-extrabold text-lg text-pink-600 shadow-lg hover:scale-105 hover:bg-pink-50 transition-all duration-200 mx-auto w-full max-w-xs"
        >
          <img src="https://www.gstatic.com/firebase/static/bin/api/img/google.png" alt="Google" className="w-6 h-6" />
          Googleでログイン
        </button>

        <p className="mt-10 text-xs text-gray-400">
          ログインすることで <span className="underline">利用規約</span> に同意したことになります
        </p>
      </div>
    </div>
  );
};

export default Login;
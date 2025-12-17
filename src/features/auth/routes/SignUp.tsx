import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../hooks/useAuth';
import { fetchCurrentUser } from '../../users/api/currentUser';

export const SignUp = () => {
  const navigate = useNavigate();
  const { logInWithGoogle } = useAuth();

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePostSignupRedirect = async () => {
    try {
      await fetchCurrentUser();
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        navigate('/onboarding');
      } else {
        console.error('Failed to resolve user record:', err);
        navigate('/');
      }
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError('');
    try {
      await logInWithGoogle();
      alert('アカウントを作成しました！');
      await handlePostSignupRedirect();
    } catch (err: any) {
      console.error('Google sign up error:', err);
      setError('Google アカウント登録に失敗しました。もう一度試してください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2 text-gray-800">NextMarket</h1>
          <p className="text-gray-600 text-sm">Googleアカウントで登録</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Google Sign Up Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          className="w-full bg-white hover:bg-gray-50 text-gray-800 font-bold py-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-300 flex items-center justify-center gap-3 shadow-sm"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isLoading ? '登録中...' : 'Google で登録'}
        </button>

        {/* Info */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>登録することで、利用規約とプライバシーポリシーに同意したものとみなされます。</p>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            既にアカウントをお持ちですか？{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">
              ログイン
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-blue-600 hover:underline">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
};

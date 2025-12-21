import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { fetchCurrentUser, upsertCurrentUser } from '../api/currentUser';
import { useAuth } from '@/hooks/useAuth';

export const UserOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setUsername] = useState(user?.displayName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.photoURL ?? '');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const existing = await fetchCurrentUser();
        if (existing && mounted) {
          navigate('/');
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          // expected for first-time users
        } else {
          console.error('Failed to load profile:', err);
          if (mounted) setError('プロフィール情報の取得に失敗しました');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('表示名を入力してください');
      return;
    }

    setSubmitting(true);
    try {
      await upsertCurrentUser({ name: name.trim(), avatarUrl: avatarUrl.trim() || undefined, bio: bio.trim() || undefined });
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('API Error:', err.response?.status, err.response?.data);
      } else {
        console.error('Failed to save profile:', err);
      }
      setError('プロフィールの保存に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">ようこそ！</h1>
        <p className="text-gray-600 text-sm text-center mb-6">はじめにプロフィールを設定してください</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">表示名 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例) TCG_master"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">アイコン URL</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ひとこと自己紹介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例) ポケカ中心に集めています。即購入OKです！"
              rows={4}
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          >
            {submitting ? '保存中...' : '保存してはじめる'}
          </button>
        </form>
      </div>
    </div>
  );
};

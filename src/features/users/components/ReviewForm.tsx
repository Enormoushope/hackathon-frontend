import { useState } from 'react';
import { createReview } from '../api/userSocial';

interface ReviewFormProps {
  currentUserId: string;
  targetUserId: string;
  onSuccess?: () => void;
}

export const ReviewForm = ({
  currentUserId,
  targetUserId,
  onSuccess,
}: ReviewFormProps) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || submitting) return;

    setSubmitting(true);
    const result = await createReview(
      currentUserId,
      targetUserId,
      rating,
      comment.trim()
    );
    setSubmitting(false);

    if (result) {
      setComment('');
      setRating(5);
      onSuccess?.();
      alert('レビューを投稿しました！');
    } else {
      alert('レビューの投稿に失敗しました');
    }
  };

  if (currentUserId === targetUserId) {
    return null; // Can't review yourself
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-sm">
      <h3 className="font-bold text-lg mb-3">レビューを書く</h3>

      <div className="mb-3">
        <label className="block text-sm font-semibold mb-2">評価</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-2xl transition-transform hover:scale-110"
            >
              {star <= rating ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-semibold mb-2">コメント</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="取引の感想を書いてください..."
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          required
        />
      </div>

      <button
        type="submit"
        disabled={!comment.trim() || submitting}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? '投稿中...' : 'レビューを投稿'}
      </button>
    </form>
  );
};

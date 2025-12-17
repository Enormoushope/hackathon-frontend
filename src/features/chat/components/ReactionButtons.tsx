import { useState, useEffect } from 'react';
import {
  addReaction,
  removeReaction,
  getItemReactions,
} from '@/features/chat/api/reactionApi';
import type { ItemReaction } from '@/features/chat/types';

interface ReactionButtonsProps {
  itemId: string;
  userId: string;
}

export const ReactionButtons = ({ itemId, userId }: ReactionButtonsProps) => {
  const [reactions, setReactions] = useState<ItemReaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await getItemReactions(itemId);
      if (mounted) {
        setReactions(data || []);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [itemId]);

  const userLiked = reactions?.some(
    (r) => r.userId === userId && r.reactionType === 'like'
  ) ?? false;
  const userWatching = reactions?.some(
    (r) => r.userId === userId && r.reactionType === 'watch'
  ) ?? false;

  const likeCount = reactions?.filter((r) => r.reactionType === 'like').length ?? 0;
  const watchCount = reactions?.filter((r) => r.reactionType === 'watch').length ?? 0;

  const handleToggleLike = async () => {
    if (userLiked) {
      const success = await removeReaction(itemId, userId, 'like');
      if (success) {
        setReactions(
          (reactions || []).filter(
            (r) => !(r.userId === userId && r.reactionType === 'like')
          )
        );
      }
    } else {
      const reaction = await addReaction(itemId, userId, 'like');
      if (reaction) {
        setReactions([...(reactions || []), reaction]);
      }
    }
  };

  const handleToggleWatch = async () => {
    if (userWatching) {
      const success = await removeReaction(itemId, userId, 'watch');
      if (success) {
        setReactions(
          (reactions || []).filter(
            (r) => !(r.userId === userId && r.reactionType === 'watch')
          )
        );
      }
    } else {
      const reaction = await addReaction(itemId, userId, 'watch');
      if (reaction) {
        setReactions([...(reactions || []), reaction]);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex gap-2">
        <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-lg"></div>
        <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleToggleLike}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
          userLiked
            ? 'bg-pink-50 border-pink-500 text-pink-600'
            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}
      >
        <span className="text-lg">{userLiked ? '❤️' : '🤍'}</span>
        <span className="font-semibold text-sm">
          いいね {likeCount > 0 && `(${likeCount})`}
        </span>
      </button>

      <button
        onClick={handleToggleWatch}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
          userWatching
            ? 'bg-yellow-50 border-yellow-500 text-yellow-600'
            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}
      >
        <span className="text-lg">{userWatching ? '⭐' : '☆'}</span>
        <span className="font-semibold text-sm">
          注目 {watchCount > 0 && `(${watchCount})`}
        </span>
      </button>
    </div>
  );
};

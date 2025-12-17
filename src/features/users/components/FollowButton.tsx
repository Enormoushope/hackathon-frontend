import { useState, useEffect } from 'react';
import { followUser, unfollowUser, getFollowers } from '../api/userSocial';

interface FollowButtonProps {
  currentUserId?: string;
  targetUserId: string;
  onToggle?: (isFollowing: boolean) => void;
}

export const FollowButton = ({ currentUserId, targetUserId, onToggle }: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log('[FollowButton] useEffect start:', { currentUserId, targetUserId });
      setLoading(true);
      if (!currentUserId) {
        console.log('[FollowButton] No currentUserId, skipping load');
        if (mounted) {
          setIsFollowing(false);
          setLoading(false);
        }
        return;
      }

      try {
        const followers = await getFollowers(targetUserId);
        console.log('[FollowButton] Loaded followers:', followers);
        if (mounted && followers) {
          const isNowFollowing = followers.some((f) => f.followerId === currentUserId);
          console.log('[FollowButton] isFollowing:', isNowFollowing);
          setIsFollowing(isNowFollowing);
          setLoading(false);
        } else if (mounted) {
          console.warn('[FollowButton] followers is null or undefined');
          setIsFollowing(false);
          setLoading(false);
        }
      } catch (err) {
        console.error('[FollowButton] Error loading followers:', err);
        if (mounted) {
          setIsFollowing(false);
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentUserId, targetUserId]);

  const handleToggle = async () => {
    if (!currentUserId || isUpdating) return;
    
    console.log('[FollowButton] handleToggle called:', { currentUserId, targetUserId, isFollowing });
    setIsUpdating(true);
    try {
      if (isFollowing) {
        console.log('[FollowButton] Unfollowing...');
        const success = await unfollowUser(currentUserId, targetUserId);
        console.log('[FollowButton] Unfollow result:', success);
        if (success) {
          setIsFollowing(false);
          onToggle?.(false);
        } else {
          console.error('[FollowButton] Unfollow failed');
        }
      } else {
        console.log('[FollowButton] Following...');
        const result = await followUser(currentUserId, targetUserId);
        console.log('[FollowButton] Follow result:', result);
        if (result) {
          setIsFollowing(true);
          onToggle?.(true);
        } else {
          console.error('[FollowButton] Follow failed');
        }
      }
    } catch (err) {
      console.error('[FollowButton] Error in handleToggle:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded-lg bg-gray-200 text-gray-400 cursor-not-allowed"
      >
        読み込み中...
      </button>
    );
  }

  if (currentUserId === targetUserId) {
    return null; // Don't show follow button for own profile
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      className={`px-6 py-2 rounded-lg font-semibold transition-all ${
        isUpdating
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
          : isFollowing
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {isUpdating ? '処理中...' : isFollowing ? 'フォロー中' : 'フォローする'}
    </button>
  );
};

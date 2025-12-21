import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebase';
import { apiClient } from '@/lib/axios';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  userId: string | null; // Backend DB user ID
  signUp: (email: string, password: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // Firebase未ログインでもバックエンドのデフォルトUIDで権限を確認
        try {
          const res = await apiClient.get('/api/auth/me');
          const backendAdmin = res.data?.isAdmin === true || res.data?.is_admin === 1;
          if (active) {
            setIsAdmin(backendAdmin);
            setUserId(res.data?.id || null);
          }
        } catch (err) {
          if (active) {
            setIsAdmin(false);
            setUserId(null);
          }
        } finally {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const res = await apiClient.get('/api/auth/me');
        // プロフィール存在 - 続行
        const backendAdmin = res.data?.isAdmin === true || res.data?.is_admin === 1;
        if (active) {
          setIsAdmin(backendAdmin);
          setUserId(res.data?.id || null);
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          // プロフィール未作成 - 自動作成
          console.log('[AuthProvider] Profile not found, auto-creating');
          try {
            const createRes = await apiClient.post('/api/auth/me', {
              name: currentUser.displayName || 'ユーザー',
              avatarUrl: currentUser.photoURL || undefined,
              bio: '',
            });
            console.log('[AuthProvider] Profile auto-created');
            if (active) {
              setIsAdmin(false);
              setUserId(createRes.data?.id || null);
            }
          } catch (createErr) {
            console.error('[AuthProvider] Auto-creation failed:', createErr);
            if (active) {
              setIsAdmin(false);
              setUserId(null);
            }
          }
        } else {
          // その他のエラー - 詳細をログ出力
          console.error('[AuthProvider] /api/auth/me request failed:', err);
          if (active) {
            setIsAdmin(false);
            setUserId(null);
          }
        }
      } finally {
        if (active) setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const logIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const getIdToken = async () => {
    try {
      if (!user) return null;
      return await user.getIdToken();
    } catch (error) {
      console.error('Failed to get ID token:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        userId,
        signUp,
        logIn,
        logInWithGoogle,
        logOut,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

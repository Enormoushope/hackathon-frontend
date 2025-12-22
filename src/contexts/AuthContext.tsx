import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase'; // 先に firebase.ts を作成しておく必要があります
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

// コンテキストの型定義
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// カスタムフック: 他のコンポーネントで使いやすくするため
export const useAuth = () => {
  const contexts = useContext(AuthContext);
  if (!contexts) throw new Error("useAuth must be used within an AuthProvider");
  return contexts;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ログアウト処理
  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    // Firebaseのログイン状態を監視するリスナー
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // 状態が確定したらローディングを解除
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
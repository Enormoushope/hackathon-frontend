import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // Storageを追加

// Firebaseコンソールの「プロジェクトの設定」からコピーした値をここに貼り付け
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// 各サービスのエクスポート
export const auth = getAuth(app);
export const storage = getStorage(app); // これで画像アップロードが可能になります

export default app;
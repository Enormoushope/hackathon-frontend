import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  children: ReactNode;
};

export const MainLayout = ({ children }: Props) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-black text-indigo-600">
            NextMarket
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/search" className="text-gray-600 hover:text-indigo-600 transition">
              🔍 検索
            </Link>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-indigo-700 transition">
              出品する
            </button>
          </div>
        </div>
      </header>

      {/* コンテンツ */}
      <main>{children}</main>
    </div>
  );
};
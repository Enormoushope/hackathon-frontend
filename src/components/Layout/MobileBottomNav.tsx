import { Link, useLocation } from 'react-router-dom';

export const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const isActive = (p: string) => pathname === p;
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm sm:hidden">
      <div className="grid grid-cols-4 text-center">
        <Link to="/" className={`py-3 text-sm ${isActive('/') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>ホーム</Link>
        <Link to="/items" className={`py-3 text-sm ${isActive('/items') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>一覧</Link>
        <Link to="/create-listing" className={`py-3 text-sm ${isActive('/create-listing') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>出品</Link>
        <Link to="/login" className={`py-3 text-sm ${isActive('/login') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>マイ</Link>
      </div>
    </nav>
  );
}

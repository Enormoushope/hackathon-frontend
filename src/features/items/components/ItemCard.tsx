import { Link } from 'react-router-dom';
import type { Item } from '../types';

type Props = {
  item: Item;
};

export const ItemCard = ({ item }: Props) => {
  const to = item.isInvestItem ? `/trade/${item.id}` : `/purchase/${item.id}`;

  return (
    <Link
      to={to}
      className="group block relative border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
      aria-label={item.itemname}
    >
      {/* 画像エリア */}
      <div className="aspect-square w-full bg-gray-200 relative overflow-hidden">
        {/* placeholder while image loads */}
        <div className="absolute inset-0 bg-gray-200 animate-pulse" aria-hidden={!item.imageUrl}></div>
        <img
          src={item.imageUrl}
          alt={item.itemname}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* 投資商品バッジ */}
        {item.isInvestItem && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
            💎 投資商品
          </div>
        )}

        {item.isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-lg font-extrabold px-4 py-1 border-2 border-white -rotate-12">
              SOLD
            </span>
          </div>
        )}
      </div>

      {/* 情報エリア */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
          {item.itemname}
        </h3>
        <p className="text-lg font-bold text-indigo-600">¥{item.price.toLocaleString()}</p>
      </div>
    </Link>
  );
};
import type { Item } from '@/features/items/types';

type Props = {
  item: Item;
};

export const ItemSummaryCard = ({ item }: Props) => {
  const displayImages = (item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : [item.imageUrl]).slice(0, 10);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <div className="flex gap-4">
        <div className="w-28 h-28 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-lg line-clamp-2">{item.title}</h2>
          <p className="font-bold text-2xl mt-3 text-red-500">¥{item.price.toLocaleString()}</p>
          {item.isSoldOut && <div className="mt-3 text-sm text-gray-500">この商品は既に販売済みです。</div>}
          {item.tags && item.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {item.tags.slice(0, 8).map((tag, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs text-gray-500 mb-2">画像</div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {displayImages.map((url, idx) => (
            <div key={idx} className="w-24 h-24 rounded-md overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100">
              <img src={url} alt={`${item.title}-${idx + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="text-[11px] text-gray-400">最大10枚まで表示します</div>
      </div>
    </div>
  );
};

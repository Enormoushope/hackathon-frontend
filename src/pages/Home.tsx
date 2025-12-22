import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products`).then(res => setProducts(res.data));
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">新着アイテム</h1>
        <Link to="/profile" className="text-blue-500">マイページ</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p: any) => (
          <Link to={`/purchase/${p.id}`} key={p.id} className="relative border rounded overflow-hidden shadow-sm">
            <img src={p.image_url} className="w-full h-40 object-cover" />
            {p.is_sold && <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] px-2 py-1 font-bold">SOLD</div>}
            <div className="p-2">
              <div className="font-bold truncate text-sm">{p.title}</div>
              <div className="text-red-600 font-bold">¥{p.price.toLocaleString()}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
export default Home;
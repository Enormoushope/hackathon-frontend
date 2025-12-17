import { Routes, Route } from 'react-router-dom';
import App from '@/src/App';
import ItemsRoute from '@/features/items/routes/ItemsRoute';
import CategoryAdmin from '@/features/items/routes/CategoryAdmin';
import UserPage from '@/features/users/routes/UserPage';
import SearchPage from '@/features/search/routes/SearchPage';

export default function RootRoutes() {
	return (
		<Routes>
			<Route path="/" element={<App />} />
			<Route path="/items" element={<ItemsRoute />} />
			<Route path="/admin/categories" element={<CategoryAdmin />} />
			<Route path="/users/:id" element={<UserPage />} />
			<Route path="/search" element={<SearchPage />} />
		</Routes>
	);
}

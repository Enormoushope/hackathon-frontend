import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// QueryClient remains eager (small) so react-query hooks work immediately.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient();

// WalletProviders is dynamically imported to avoid bundling heavy wallet libs
const WalletProviders = React.lazy(() => import('./providers/WalletProviders'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div className="p-6 text-center">Wallets 初期化中...</div>}>
        <WalletProviders>
          <App />
        </WalletProviders>
      </Suspense>
    </QueryClientProvider>
  </React.StrictMode>,
);
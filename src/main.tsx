import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Polyfill for React Scheduler - ensure performance.unstable_now is defined
if (typeof performance === 'undefined') {
  globalThis.performance = {} as any;
}
if (!performance.unstable_now) {
  performance.unstable_now = () => Date.now();
}

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
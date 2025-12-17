import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';

// NOTE: This file imports heavy wallet libs (rainbowkit/wagmi/viem) but
// the module itself is loaded via `React.lazy()` so these imports are
// code-split into a separate chunk at build time.
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '../wagmi';

const queryClient = new QueryClient();

export const WalletProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    return (
      <WagmiConfig config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={darkTheme()}>
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiConfig>
    );
  } catch (e) {
    // If something goes wrong during provider initialization, show a readable fallback
    // to avoid a silent white screen.
    // eslint-disable-next-line no-console
    console.error('WalletProviders init failed', e);
    return <div className="p-6 text-center text-red-600">Wallet 初期化に失敗しました。コンソールを確認してください。</div>;
  }
};

export default WalletProviders;

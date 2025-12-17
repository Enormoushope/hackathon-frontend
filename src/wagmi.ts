import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

// ハッカソン用なのでProject IDは本来WalletConnectで取得しますが、
// テスト用なら "public" か適当な文字列でも一旦動くことが多いです。
// 動かない場合は https://cloud.walletconnect.com/ で無料取得してください。
const projectId = 'YOUR_PROJECT_ID'; 

export const config = getDefaultConfig({
  appName: 'NextMarket',
  projectId: projectId,
  chains: [sepolia], // テストネット(Sepolia)を使用
  ssr: false, // Vite(SPA)なのでfalse
});
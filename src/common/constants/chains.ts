import { Chain, defineChain } from 'viem';
import { arbitrum, bsc, mainnet } from 'viem/chains';

export const DEFAULT_BUY_AMOUNTS = [0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.1, 0.12];

const ETH_BUY_AMOUNTS = [0.005, 0.01, 0.02, 0.03, 0.05, 0.08];

// Arbitrum Orbit L2, not shipped with viem
const robinhoodChain = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.chain.robinhood.com'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://robinhoodchain.blockscout.com' },
  },
});

export const CHAIN_KEYS = ['bnb', 'eth', 'arb', 'rh'] as const;

export type ChainKey = (typeof CHAIN_KEYS)[number];

export type ChainInfo = {
  key: ChainKey;
  label: string;
  viemChain: Chain;
  nativeSymbol: string;
  nativeDecimals: number;
  defaultRpcUrl: string;
  rpcEnvKey: 'EVM_RPC_URL' | 'ETH_RPC_URL' | 'ARB_RPC_URL' | 'RH_RPC_URL';
  defaultBuyAmounts: number[];
  explorer: {
    scanUrl: string;
    dexscreenerSlug: string;
    // omitted when the aggregator does not index the chain
    dextoolsSlug?: string;
    birdeyeSlug?: string;
  };
};

export const CHAINS: Record<ChainKey, ChainInfo> = {
  bnb: {
    key: 'bnb',
    label: 'BNB Chain',
    viemChain: bsc,
    nativeSymbol: bsc.nativeCurrency.symbol,
    nativeDecimals: bsc.nativeCurrency.decimals,
    defaultRpcUrl: 'https://bsc-dataseed1.bnbchain.org',
    rpcEnvKey: 'EVM_RPC_URL',
    defaultBuyAmounts: DEFAULT_BUY_AMOUNTS,
    explorer: {
      scanUrl: 'https://bscscan.com',
      dexscreenerSlug: 'bsc',
      dextoolsSlug: 'bnb',
      birdeyeSlug: 'bsc',
    },
  },
  eth: {
    key: 'eth',
    label: 'Ethereum',
    viemChain: mainnet,
    nativeSymbol: mainnet.nativeCurrency.symbol,
    nativeDecimals: mainnet.nativeCurrency.decimals,
    defaultRpcUrl: 'https://ethereum-rpc.publicnode.com',
    rpcEnvKey: 'ETH_RPC_URL',
    defaultBuyAmounts: ETH_BUY_AMOUNTS,
    explorer: {
      scanUrl: 'https://etherscan.io',
      dexscreenerSlug: 'ethereum',
      dextoolsSlug: 'ether',
      birdeyeSlug: 'ethereum',
    },
  },
  arb: {
    key: 'arb',
    label: 'Arbitrum',
    viemChain: arbitrum,
    nativeSymbol: arbitrum.nativeCurrency.symbol,
    nativeDecimals: arbitrum.nativeCurrency.decimals,
    defaultRpcUrl: 'https://arb1.arbitrum.io/rpc',
    rpcEnvKey: 'ARB_RPC_URL',
    defaultBuyAmounts: ETH_BUY_AMOUNTS,
    explorer: {
      scanUrl: 'https://arbiscan.io',
      dexscreenerSlug: 'arbitrum',
      dextoolsSlug: 'arbitrum',
      birdeyeSlug: 'arbitrum',
    },
  },
  rh: {
    key: 'rh',
    label: 'Robinhood',
    viemChain: robinhoodChain,
    nativeSymbol: robinhoodChain.nativeCurrency.symbol,
    nativeDecimals: robinhoodChain.nativeCurrency.decimals,
    defaultRpcUrl: 'https://rpc.mainnet.chain.robinhood.com',
    rpcEnvKey: 'RH_RPC_URL',
    defaultBuyAmounts: ETH_BUY_AMOUNTS,
    explorer: {
      scanUrl: 'https://robinhoodchain.blockscout.com',
      dexscreenerSlug: 'robinhood',
    },
  },
};

export const DEFAULT_CHAIN_KEY: ChainKey = 'bnb';

export function getChain(key: ChainKey): ChainInfo {
  return CHAINS[key];
}

export function isChainKey(value: string): value is ChainKey {
  return (CHAIN_KEYS as readonly string[]).includes(value);
}

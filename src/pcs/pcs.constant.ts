import { Native } from '@pancakeswap/sdk';
import { bsc } from 'viem/chains';

export const V2_SUBGRAPH_CLIENT = 'PANCAKE_V2_SUBGRAPH_CLIENT';
export const V3_SUBGRAPH_CLIENT = 'PANCAKE_V3_SUBGRAPH_CLIENT';

// Default BSC RPC URL
export const EVM_RPC_URL = 'https://bsc-dataseed1.bnbchain.org';

// PancakeSwap Subgraph URLs for BSC
export const PANCAKE_V3_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc';
export const PANCAKE_V2_SUBGRAPH_URL = 'https://proxy-worker-api.pancakeswap.com/bsc-exchange';

export const PANCAKE_SMART_ROUTER_ADDRESS = '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4';

// Common tokens on BSC
export const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
export const BUSD_ADDRESS = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';
export const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
export const CAKE_ADDRESS = '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82';

export const PANCAKE_NATIVE_TOKEN_ADDRESS = Native.onChain(bsc.id).asToken.address;

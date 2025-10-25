import { Hex } from 'viem';
import { bsc } from 'viem/chains';

export const MAIN_CHAIN_ID = bsc.id;

export const NATIVE_TOKEN = bsc.nativeCurrency.symbol;

// Use a special constant for native BNB (not an actual contract address)
export const NATIVE_BNB_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Hex;

export const TOKEN_ADDRESS: Record<string, Hex> = {
  BNB: NATIVE_BNB_ADDRESS,
  USDT: '0x55d398326f99059ff775485246999027b3197955',
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
};

export const NATIVE_TOKEN_DECIMALS = bsc.nativeCurrency.decimals;

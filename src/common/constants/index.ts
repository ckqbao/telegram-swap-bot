import { Hex } from 'viem';
import { bsc } from 'viem/chains';

export const NATIVE_TOKEN = bsc.nativeCurrency.symbol;

export const TOKEN_ADDRESS: Record<string, Hex> = {
  BNB: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  USDT: '0x55d398326f99059ff775485246999027b3197955',
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
};

export const TOKEN_DECIMALS = bsc.nativeCurrency.decimals;

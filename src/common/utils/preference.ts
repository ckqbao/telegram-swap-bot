import { ChainKey, DEFAULT_CHAIN_KEY, getChain, isChainKey } from '@/common/constants';

type PreferenceLike = {
  chain?: string;
  buyAmounts?: number[];
  buyAmountsByChain?: Partial<Record<ChainKey, number[]>>;
};

export function resolveChainKey(preference: PreferenceLike): ChainKey {
  const { chain } = preference;
  if (chain && isChainKey(chain)) return chain;
  return DEFAULT_CHAIN_KEY;
}

export function resolveBuyAmounts(preference: PreferenceLike, chainKey: ChainKey): number[] {
  const perChain = preference.buyAmountsByChain?.[chainKey];
  if (perChain?.length) return perChain;
  if (chainKey === DEFAULT_CHAIN_KEY && preference.buyAmounts?.length) return preference.buyAmounts;
  return getChain(chainKey).defaultBuyAmounts;
}

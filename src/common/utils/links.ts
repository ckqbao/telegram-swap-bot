import { ChainKey, getChain } from '@/common/constants';

export const contractLink = (tokenAddress: string, chainKey: ChainKey) => {
  return `<a href="${getChain(chainKey).explorer.scanUrl}/token/${tokenAddress}">Contract</a>`;
};

export const birdeyeLink = (tokenAddress: string, chainKey: ChainKey) => {
  const slug = getChain(chainKey).explorer.birdeyeSlug;
  if (!slug) return null;
  return `<a href="https://birdeye.so/${slug}/token/${tokenAddress}">Birdeye</a>`;
};

export const dextoolLink = (tokenAddress: string, chainKey: ChainKey) => {
  const slug = getChain(chainKey).explorer.dextoolsSlug;
  if (!slug) return null;
  return `<a href="https://www.dextools.io/app/en/${slug}/pair-explorer/${tokenAddress}">Dextools</a>`;
};

export const dexscreenerLink = (tokenAddress: string, chainKey: ChainKey) => {
  return `<a href="https://dexscreener.com/${getChain(chainKey).explorer.dexscreenerSlug}/${tokenAddress}">Dexscreener</a>`;
};

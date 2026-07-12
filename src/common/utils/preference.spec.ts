import { resolveBuyAmounts, resolveChainKey } from './preference';
import { CHAINS, DEFAULT_BUY_AMOUNTS } from '@/common/constants';

describe('resolveChainKey', () => {
  it('falls back to bnb when chain is missing (lean docs have no defaults)', () => {
    expect(resolveChainKey({})).toBe('bnb');
    expect(resolveChainKey({ chain: undefined })).toBe('bnb');
  });

  it('returns the stored chain', () => {
    expect(resolveChainKey({ chain: 'arb' })).toBe('arb');
  });

  it('falls back to bnb on an unknown stored value', () => {
    expect(resolveChainKey({ chain: 'dogechain' })).toBe('bnb');
  });
});

describe('resolveBuyAmounts', () => {
  it('prefers the per-chain amounts', () => {
    const pref = { buyAmounts: [1, 2], buyAmountsByChain: { eth: [0.01, 0.02] } };
    expect(resolveBuyAmounts(pref, 'eth')).toEqual([0.01, 0.02]);
  });

  it('treats the legacy flat array as the bnb entry', () => {
    const pref = { buyAmounts: [1, 2] };
    expect(resolveBuyAmounts(pref, 'bnb')).toEqual([1, 2]);
  });

  it('does NOT leak legacy bnb amounts onto other chains', () => {
    const pref = { buyAmounts: [1, 2] };
    expect(resolveBuyAmounts(pref, 'eth')).toEqual(CHAINS.eth.defaultBuyAmounts);
  });

  it('falls back to registry defaults when nothing is stored', () => {
    expect(resolveBuyAmounts({}, 'bnb')).toEqual(DEFAULT_BUY_AMOUNTS);
    expect(resolveBuyAmounts({}, 'arb')).toEqual(CHAINS.arb.defaultBuyAmounts);
  });
});

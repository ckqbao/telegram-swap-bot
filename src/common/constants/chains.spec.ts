import { CHAINS, CHAIN_KEYS, DEFAULT_CHAIN_KEY, getChain, isChainKey } from './chains';

describe('chain registry', () => {
  it('supports bnb, eth, arb and rh', () => {
    expect(CHAIN_KEYS).toEqual(['bnb', 'eth', 'arb', 'rh']);
    expect(Object.keys(CHAINS).sort()).toEqual([...CHAIN_KEYS].sort());
  });

  it('defaults to bnb', () => {
    expect(DEFAULT_CHAIN_KEY).toBe('bnb');
  });

  it('maps to the right chain ids', () => {
    expect(getChain('bnb').viemChain.id).toBe(56);
    expect(getChain('eth').viemChain.id).toBe(1);
    expect(getChain('arb').viemChain.id).toBe(42161);
    expect(getChain('rh').viemChain.id).toBe(4663);
  });

  it('uses ETH as the native token on robinhood chain', () => {
    expect(getChain('rh').nativeSymbol).toBe('ETH');
    expect(getChain('rh').nativeDecimals).toBe(18);
  });

  it('uses the ETH symbol on arbitrum', () => {
    expect(getChain('arb').nativeSymbol).toBe('ETH');
    expect(getChain('bnb').nativeSymbol).toBe('BNB');
  });

  it('has smaller default buy amounts on eth/arb than bnb', () => {
    expect(Math.max(...getChain('eth').defaultBuyAmounts)).toBeLessThan(Math.max(...getChain('bnb').defaultBuyAmounts));
  });

  it('recognizes valid chain keys', () => {
    expect(isChainKey('arb')).toBe(true);
    expect(isChainKey('dogechain')).toBe(false);
  });
});

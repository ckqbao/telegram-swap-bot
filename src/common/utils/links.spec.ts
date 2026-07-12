import { birdeyeLink, contractLink, dexscreenerLink, dextoolLink } from './links';

describe('chain-aware links', () => {
  const addr = '0x1234';

  it('builds bnb links (default behavior preserved)', () => {
    expect(contractLink(addr, 'bnb')).toContain('https://bscscan.com/token/0x1234');
    expect(dexscreenerLink(addr, 'bnb')).toContain('dexscreener.com/bsc/0x1234');
    expect(dextoolLink(addr, 'bnb')).toContain('dextools.io/app/en/bnb/pair-explorer/0x1234');
    expect(birdeyeLink(addr, 'bnb')).toContain('birdeye.so/bsc/token/0x1234');
  });

  it('builds ethereum links', () => {
    expect(contractLink(addr, 'eth')).toContain('https://etherscan.io/token/0x1234');
    expect(dexscreenerLink(addr, 'eth')).toContain('dexscreener.com/ethereum/0x1234');
  });

  it('builds arbitrum links', () => {
    expect(contractLink(addr, 'arb')).toContain('https://arbiscan.io/token/0x1234');
    expect(dexscreenerLink(addr, 'arb')).toContain('dexscreener.com/arbitrum/0x1234');
    expect(dextoolLink(addr, 'arb')).toContain('dextools.io/app/en/arbitrum/pair-explorer/0x1234');
    expect(birdeyeLink(addr, 'arb')).toContain('birdeye.so/arbitrum/token/0x1234');
  });

  it('builds robinhood chain links, skipping unsupported explorers', () => {
    expect(contractLink(addr, 'rh')).toContain('https://robinhoodchain.blockscout.com/token/0x1234');
    expect(dexscreenerLink(addr, 'rh')).toContain('dexscreener.com/robinhood/0x1234');
    expect(dextoolLink(addr, 'rh')).toBeNull();
    expect(birdeyeLink(addr, 'rh')).toBeNull();
  });
});

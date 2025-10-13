export const contractLink = (tokenAddress: string) => {
  return `<a href="https://bscscan.com/token/${tokenAddress}">Contract</a>`;
};

export const birdeyeLink = (tokenAddress: string) => {
  return `<a href="https://birdeye.so/bsc/token/${tokenAddress}">Birdeye</a>`;
};

export const dextoolLink = (tokenAddress: string) => {
  return `<a href="https://www.dextools.io/app/en/bnb/pair-explorer/${tokenAddress}">Dextools</a>`;
};

export const dexscreenerLink = (tokenAddress: string) => {
  return `<a href="https://dexscreener.com/bsc/${tokenAddress}">Dexscreener</a>`;
};

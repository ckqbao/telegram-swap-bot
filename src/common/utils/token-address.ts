import { PublicKey } from '@solana/web3.js';

export const isSolanaTokenAddress = (address: string) => {
  let publicKey: PublicKey;
  try {
    publicKey = new PublicKey(address);
    return PublicKey.isOnCurve(publicKey.toBytes());
  } catch {
    return false;
  }
};

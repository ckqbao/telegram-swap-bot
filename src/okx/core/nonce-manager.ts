import { ethers } from 'ethers';

// Resync from chain if the wallet has been idle for this long, to pick up
// transactions sent outside the bot
const STATE_TTL_MS = 30_000;

type NonceState = {
  nextNonce: number | null;
  lastReservedAt: number;
  lock: Promise<unknown>;
};

/**
 * Hands out sequential nonces per (chain, wallet) so multiple transactions can
 * be in flight concurrently without racing on `getTransactionCount`. The chain
 * is only queried on first use, after idleness, or after a send failure
 * (via `markStale`).
 */
class WalletNonceManager {
  private readonly states = new Map<string, NonceState>();

  async reserve(provider: ethers.Provider, chainId: string, address: string): Promise<number> {
    const state = this.getState(chainId, address);
    const reservation = state.lock.then(async () => {
      const now = Date.now();
      if (state.nextNonce === null || now - state.lastReservedAt > STATE_TTL_MS) {
        const pendingCount = await provider.getTransactionCount(address, 'pending');
        // Never go below the local counter: pending transactions the RPC has
        // not indexed yet must keep their reserved nonces
        state.nextNonce = state.nextNonce === null ? pendingCount : Math.max(state.nextNonce, pendingCount);
      }
      state.lastReservedAt = now;
      return state.nextNonce++;
    });
    state.lock = reservation.catch(() => undefined);
    return reservation;
  }

  /** Call after a send failure so the next reservation resyncs from the chain. */
  markStale(chainId: string, address: string) {
    const state = this.getState(chainId, address);
    state.lock = state.lock.then(() => {
      state.nextNonce = null;
    });
  }

  private getState(chainId: string, address: string): NonceState {
    const key = `${chainId}:${address.toLowerCase()}`;
    let state = this.states.get(key);
    if (!state) {
      state = { nextNonce: null, lastReservedAt: 0, lock: Promise.resolve() };
      this.states.set(key, state);
    }
    return state;
  }
}

export const walletNonceManager = new WalletNonceManager();

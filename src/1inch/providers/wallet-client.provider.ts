import { Provider } from '@nestjs/common';
import { createWalletClient, http, publicActions, WalletClient } from 'viem';
import { bsc } from 'viem/chains';
import { WALLET_CLIENT } from '../1inch.constant';

function extendClient(client: WalletClient) {
  return client.extend(publicActions);
}

export type ExtendedWalletClient = ReturnType<typeof extendClient>;

export const walletClientProvider: Provider<ExtendedWalletClient> = {
  provide: WALLET_CLIENT,
  useFactory: () => {
    const client = createWalletClient({
      chain: bsc,
      transport: http(),
    });
    return extendClient(client);
  },
};

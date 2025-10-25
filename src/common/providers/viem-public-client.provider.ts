import { Provider } from '@nestjs/common';
import { Chain, createPublicClient, http, PublicClient, Transport, walletActions } from 'viem';
import { bsc } from 'viem/chains';
import { env } from '@/env/env';
import { VIEM_PUBLIC_CLIENT } from '../constants/provider.constant';

function extendClient(client: PublicClient<Transport, Chain>) {
  return client.extend(walletActions);
}

export type ViemPublicClient = ReturnType<typeof extendClient>;

export const viemPublicClientProvider: Provider<ViemPublicClient> = {
  provide: VIEM_PUBLIC_CLIENT,
  useFactory: () => {
    const rpcUrl = env.EVM_RPC_URL;

    const client = createPublicClient({
      chain: bsc,
      transport: http(rpcUrl),
      batch: {
        multicall: {
          batchSize: 1024 * 200, // Optimize multicall batching for better performance
        },
      },
    });

    return extendClient(client);
  },
};

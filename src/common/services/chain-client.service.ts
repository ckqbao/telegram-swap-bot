import { Injectable } from '@nestjs/common';
import { createPublicClient, http } from 'viem';
import { env } from '@/env/env';
import { ChainKey, getChain } from '../constants';
import { extendClient, ViemPublicClient } from '../providers/viem-public-client.provider';

@Injectable()
export class ChainClientService {
  private readonly clients = new Map<ChainKey, ViemPublicClient>();

  getClient(chainKey: ChainKey): ViemPublicClient {
    const existing = this.clients.get(chainKey);
    if (existing) return existing;

    const chain = getChain(chainKey);
    const rpcUrl = env[chain.rpcEnvKey] ?? chain.defaultRpcUrl;
    const client = createPublicClient({
      chain: chain.viemChain,
      transport: http(rpcUrl),
      batch: {
        multicall: {
          batchSize: 1024 * 200, // Optimize multicall batching for better performance
        },
      },
    });

    const extended = extendClient(client);
    this.clients.set(chainKey, extended);
    return extended;
  }
}

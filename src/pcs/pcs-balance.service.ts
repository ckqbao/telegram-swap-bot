import { Inject, Injectable, Logger } from '@nestjs/common';
import { Hex, PublicClient, erc20Abi } from 'viem';
import { VIEM_PUBLIC_CLIENT } from '@/common/constants/provider.constant';
import { BalanceQuery, BalanceResult, MultiBalanceQuery } from './types/balance';

@Injectable()
export class PcsBalanceService {
  private readonly logger = new Logger(PcsBalanceService.name);

  constructor(@Inject(VIEM_PUBLIC_CLIENT) private readonly publicClient: PublicClient) {}

  /**
   * Get the balance of a single token for a given address
   */
  async getTokenBalance(query: BalanceQuery): Promise<BalanceResult> {
    try {
      const { token, address } = query;

      // Get balance, decimals, symbol, and name in parallel using multicall
      const [balance, decimals, symbol, name] = await Promise.all([
        this.publicClient.readContract({
          address: token,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        }),
        this.publicClient.readContract({
          address: token,
          abi: erc20Abi,
          functionName: 'decimals',
        }),
        this.publicClient
          .readContract({
            address: token,
            abi: erc20Abi,
            functionName: 'symbol',
          })
          .catch(() => undefined),
        this.publicClient
          .readContract({
            address: token,
            abi: erc20Abi,
            functionName: 'name',
          })
          .catch(() => undefined),
      ]);

      return {
        token,
        address,
        balance,
        decimals,
        symbol,
        name,
      };
    } catch (error) {
      this.logger.error(`Failed to get token balance: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get balances for multiple tokens for a given address
   */
  async getMultipleTokenBalances(query: MultiBalanceQuery): Promise<BalanceResult[]> {
    try {
      const { tokens, address } = query;

      // Query all token balances in parallel
      const balancePromises = tokens.map((token) => this.getTokenBalance({ token, address }));

      return await Promise.all(balancePromises);
    } catch (error) {
      this.logger.error(`Failed to get multiple token balances: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get native BNB balance for a given address
   */
  async getNativeBalance(address: Hex): Promise<bigint> {
    try {
      const balance = await this.publicClient.getBalance({ address });
      this.logger.log(`Native balance for ${address}: ${balance.toString()}`);
      return balance;
    } catch (error) {
      this.logger.error(`Failed to get native balance: ${error.message}`, error.stack);
      throw error;
    }
  }
}

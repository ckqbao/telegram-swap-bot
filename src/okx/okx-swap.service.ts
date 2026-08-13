import { Injectable, Logger } from '@nestjs/common';
import { createEVMWallet } from '@okx-dex/okx-dex-sdk/dist/core/evm-wallet';
import { parseUnits } from 'ethers';
import { getChain } from '@/common/constants';
import {
  OnStatusUpdate,
  OnSwapSettled,
  Swap,
  SwapAmountTooLowError,
  SwapConfig,
} from '@/common/interfaces/swap.interface';
import { ViemPublicClient } from '@/common/providers';
import { ChainClientService } from '@/common/services/chain-client.service';
import { getEthersProvider } from '@/common/utils/ethers-adapter';
import { OKXClient } from './core/okx-client';
import { toBaseUnits } from './utils/units';
import { OKX_ERROR_CODE_AMOUNT_TOO_LOW, OKX_NATIVE_TOKEN_ADDRESS } from './okx.constant';
import { env } from '@/env/env';

function isAmountTooLowError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error as Error & { responseBody?: { code?: string } }).responseBody?.code === OKX_ERROR_CODE_AMOUNT_TOO_LOW
  );
}

@Injectable()
export class OkxSwapService implements Swap {
  private readonly logger = new Logger(OkxSwapService.name);
  readonly nativeTokenAddress = OKX_NATIVE_TOKEN_ADDRESS;

  constructor(private readonly chainClientService: ChainClientService) {}

  async buyToken() {}

  async performSwap(config: SwapConfig, onStatusUpdate?: OnStatusUpdate, onSettled?: OnSwapSettled) {
    const { amountToSwap, chain, privateKey, fromTokenAddress, fromTokenDecimals, toTokenAddress, slippage } = config;

    const client = this.chainClientService.getClient(chain);
    const { evmWallet, okxClient } = this.initializeOkxClient(privateKey, client);
    const chainId = `${getChain(chain).viemChain.id}`;
    const isNativeSwap = fromTokenAddress === this.nativeTokenAddress;

    if (!isNativeSwap) {
      await this.approveIfNeeded(okxClient, chainId, fromTokenAddress, fromTokenDecimals, amountToSwap, onStatusUpdate);
    }

    if (config.approveOnly) return;

    const amount = parseUnits(amountToSwap, fromTokenDecimals).toString();

    await onStatusUpdate?.('swapping');

    this.logger.log(`Executing swap at: ${new Date().toISOString()}`);
    let result: Awaited<ReturnType<typeof okxClient.dex.executeSwap>>;
    try {
      result = await okxClient.dex.executeSwap(
        {
          chainId,
          fromTokenAddress,
          toTokenAddress,
          amount,
          slippage: `${slippage / 100}`,
          userWalletAddress: evmWallet.address,
          feePercent: env.OKX_FEE_PERCENT,
          fromTokenReferrerWalletAddress: env.DEV_WALLET_ADDRESS,
        },
        onSettled,
      );
    } catch (error) {
      if (isAmountTooLowError(error)) throw new SwapAmountTooLowError();
      throw error;
    }

    if (!result.success) {
      throw new Error('Swap failed');
    }

    this.logger.log(`Swap submitted: ${result.transactionId}`);
    await onStatusUpdate?.('submitted');
  }

  private async approveIfNeeded(
    okxClient: OKXClient,
    chainId: string,
    tokenAddress: string,
    tokenDecimals: number,
    amount: string,
    onStatusUpdate?: OnStatusUpdate,
  ) {
    await onStatusUpdate?.('approving');
    this.logger.log('Approving token...');

    const rawAmount = toBaseUnits(amount, tokenDecimals);

    const result = await okxClient.dex.executeApproval({
      chainId,
      tokenContractAddress: tokenAddress,
      approveAmount: rawAmount,
    });

    if ('alreadyApproved' in result) {
      this.logger.log('Token already approved');
      await onStatusUpdate?.('already-approved');
      return;
    }

    this.logger.log('Token approved');
    await onStatusUpdate?.('approved');
  }

  private initializeOkxClient(privateKey: string, client: ViemPublicClient) {
    const evmWallet = createEVMWallet(privateKey, getEthersProvider(client));
    const okxClient = new OKXClient(evmWallet);
    return { evmWallet, okxClient };
  }
}

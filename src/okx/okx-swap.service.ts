import { Inject, Injectable, Logger } from '@nestjs/common';
import { createEVMWallet } from '@okx-dex/okx-dex-sdk/dist/core/evm-wallet';
import { parseUnits } from 'ethers';
import { MAIN_CHAIN_ID, NATIVE_TOKEN_DECIMALS } from '@/common/constants';
import { OnStatusUpdate, Swap, SwapConfig } from '@/common/interfaces/swap.interface';
import { ViemPublicClient } from '@/common/providers';
import { getEthersProvider } from '@/common/utils/ethers-adapter';
import { VIEM_PUBLIC_CLIENT } from '@/common/constants/provider.constant';
import { OKXClient } from './core/okx-client';
import { toBaseUnits } from './utils/units';
import { OKX_NATIVE_TOKEN_ADDRESS } from './okx.constant';

@Injectable()
export class OkxSwapService implements Swap {
  private readonly logger = new Logger(OkxSwapService.name);
  readonly nativeTokenAddress = OKX_NATIVE_TOKEN_ADDRESS;

  constructor(@Inject(VIEM_PUBLIC_CLIENT) private readonly viemPublicClient: ViemPublicClient) {}

  async buyToken() {}

  async performSwap(config: SwapConfig, onStatusUpdate?: OnStatusUpdate) {
    const { amountToSwap, privateKey, fromTokenAddress, fromTokenDecimals, toTokenAddress, slippage } = config;

    const { evmWallet, okxClient } = this.initializeOkxClient(privateKey);
    const chainId = `${this.viemPublicClient.chain.id}`;
    const isNativeSwap = fromTokenAddress === this.nativeTokenAddress;

    if (!isNativeSwap) {
      await this.approveIfNeeded(okxClient, fromTokenAddress, fromTokenDecimals, amountToSwap, onStatusUpdate);
    }

    const amount = parseUnits(amountToSwap, fromTokenDecimals).toString();

    onStatusUpdate?.('swapping');

    this.logger.log(`Executing swap at: ${new Date().toISOString()}`);
    await okxClient.dex.executeSwap({
      chainId,
      fromTokenAddress,
      toTokenAddress,
      amount,
      slippage: `${slippage / 100}`,
      userWalletAddress: evmWallet.address,
    });
  }

  private async approveIfNeeded(
    okxClient: OKXClient,
    tokenAddress: string,
    tokenDecimals: number,
    amount: string,
    onStatusUpdate?: OnStatusUpdate,
  ) {
    onStatusUpdate?.('approving');

    const chainId = `${MAIN_CHAIN_ID}`;
    const rawAmount = toBaseUnits(amount, tokenDecimals);

    const result = await okxClient.dex.executeApproval({
      chainId,
      tokenContractAddress: tokenAddress,
      approveAmount: rawAmount,
    });

    if ('alreadyApproved' in result) {
      onStatusUpdate?.('already-approved');
      return;
    }

    onStatusUpdate?.('approved');
  }

  private initializeOkxClient(privateKey: string) {
    const evmWallet = createEVMWallet(privateKey, getEthersProvider(this.viemPublicClient));
    const okxClient = new OKXClient(evmWallet);
    return { evmWallet, okxClient };
  }
}

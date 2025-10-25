import { Injectable, Logger } from '@nestjs/common';
import {
  Address,
  FusionSDK,
  NativeOrdersFactory,
  NetworkEnum,
  OrderStatus,
  PreparedOrder,
  PrivateKeyProviderConnector,
  Web3Like,
} from '@1inch/fusion-sdk';
import { computeAddress, JsonRpcProvider, Wallet } from 'ethers';
import { bsc } from 'viem/chains';
import { env } from '@/env/env';
import { Swap, SwapConfig } from '@/common/interfaces/swap.interface';
import { ONE_INCH_NATIVE_TOKEN_ADDRESS } from './1inch.constant';

const NativeOrderFactoryAddress = '0xa562172dd87480687debca1cd7ab6a309919e9d8';

const ethersRpcProvider = new JsonRpcProvider(bsc.rpcUrls.default.http[0]);

const ethersProviderConnector: Web3Like = {
  eth: {
    call(transactionConfig): Promise<string> {
      return ethersRpcProvider.call(transactionConfig);
    },
  },
  extend(): void {},
};

@Injectable()
export class OneInchFusionSwapService implements Swap {
  private readonly logger = new Logger(OneInchFusionSwapService.name);
  readonly nativeTokenAddress = ONE_INCH_NATIVE_TOKEN_ADDRESS;

  constructor() {}

  async performSwap(config: SwapConfig) {
    const { privateKey, fromTokenAddress, fromTokenDecimals, toTokenAddress, amountToSwap } = config;

    const params = {
      fromTokenAddress,
      toTokenAddress,
      amount: amountToSwap.toString(),
      walletAddress: computeAddress(privateKey),
    };

    const sdk = this.getFusionSDK(privateKey);

    // const quote = await sdk.getQuote(params);

    const preparedOrder = await sdk.createOrder(params);

    const info =
      fromTokenAddress === this.nativeTokenAddress
        ? await this.submitNativeOrder(sdk, preparedOrder, privateKey)
        : await this.submitOrder(sdk, preparedOrder);

    while (true) {
      try {
        const data = await sdk.getOrderStatus(info.orderHash);

        if (
          data.status === OrderStatus.Filled ||
          data.status === OrderStatus.Expired ||
          data.status === OrderStatus.Cancelled
        ) {
          break;
        }
      } catch (e) {
        this.logger.error(`Failed to get order status: ${e.message}`);
      }
    }
  }

  private getFusionSDK(privateKey: string) {
    const connector = new PrivateKeyProviderConnector(privateKey, ethersProviderConnector);

    return new FusionSDK({
      url: `${env.ONE_INCH_BASE_URL}/fusion`,
      network: NetworkEnum.BINANCE,
      blockchainProvider: connector,
      authKey: env.ONE_INCH_API_KEY,
    });
  }

  private async submitNativeOrder(sdk: FusionSDK, preparedOrder: PreparedOrder, privateKey: string) {
    const wallet = new Wallet(privateKey, ethersRpcProvider);

    const info = await sdk.submitNativeOrder(
      preparedOrder.order,
      new Address(computeAddress(privateKey)),
      preparedOrder.quoteId,
    );

    console.log('OrderHash', info.orderHash);

    const factory = new NativeOrdersFactory(new Address(NativeOrderFactoryAddress));
    const call = factory.create(new Address(wallet.address), info.order);

    const txRes = await wallet.sendTransaction({
      to: call.to.toString(),
      data: call.data,
      value: call.value,
    });

    console.log('TxHash', txRes.hash);

    await wallet.provider?.waitForTransaction(txRes.hash);

    return info;
  }

  private async submitOrder(sdk: FusionSDK, preparedOrder: PreparedOrder) {
    return await sdk.submitOrder(preparedOrder.order, preparedOrder.quoteId);
  }
}

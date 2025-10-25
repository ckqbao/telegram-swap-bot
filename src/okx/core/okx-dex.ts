import {
  ApproveTokenParams,
  ChainConfig,
  DexAPI,
  NetworkConfigs,
  OKXConfig,
  SwapParams,
  SwapResult,
} from '@okx-dex/okx-dex-sdk';
import { HTTPClient } from '@okx-dex/okx-dex-sdk/dist/core/http-client';
import { BscSwap } from './bsc-swap';
import { EVMApproveExecutor } from './evm-approve';

export class OkxDex extends DexAPI {
  private readonly _defaultNetworkConfigs: NetworkConfigs = {
    '501': {
      id: '501',
      explorer: 'https://web3.okx.com/explorer/sol/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      computeUnits: 300000,
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '784': {
      id: '784',
      explorer: 'https://web3.okx.com/explorer/sui/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '43114': {
      // Avalanche C-Chain
      id: '43114',
      explorer: 'https://web3.okx.com/explorer/avax/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '1': {
      // Ethereum Mainnet
      id: '1',
      explorer: 'https://web3.okx.com/explorer/ethereum/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '137': {
      // Polygon Mainnet
      id: '137',
      explorer: 'https://web3.okx.com/explorer/polygon/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '146': {
      // Sonic Mainnet
      id: '146',
      explorer: 'https://web3.okx.com/explorer/sonic/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '8453': {
      // Base Mainnet
      id: '8453',
      explorer: 'https://web3.okx.com/explorer/base/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '196': {
      // X Layer Mainnet
      id: '196',
      explorer: 'https://web3.okx.com/explorer/x-layer/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '10': {
      // Optimism
      id: '10',
      explorer: 'https://web3.okx.com/explorer/optimism/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '42161': {
      // Arbitrum
      id: '42161',
      explorer: 'https://web3.okx.com/explorer/arbitrum/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '56': {
      // Binance Smart Chain
      id: '56',
      explorer: 'https://web3.okx.com/explorer/bsc/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '100': {
      // Gnosis
      id: '100',
      explorer: 'https://web3.okx.com/explorer/gnosis/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '169': {
      // Manta Pacific
      id: '169',
      explorer: 'https://web3.okx.com/explorer/manta/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '250': {
      // Fantom Opera
      id: '250',
      explorer: 'https://web3.okx.com/explorer/ftm/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '324': {
      // zkSync Era
      id: '324',
      explorer: 'https://web3.okx.com/explorer/zksync/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '1101': {
      // Polygon zkEVM
      id: '1101',
      explorer: 'https://web3.okx.com/explorer/polygon-zkevm/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '5000': {
      // Mantle
      id: '5000',
      explorer: 'https://web3.okx.com/explorer/mantle/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '25': {
      // Cronos
      id: '25',
      explorer: 'https://cronoscan.com/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '534352': {
      // Scroll
      id: '534352',
      explorer: 'https://web3.okx.com/explorer/scroll/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '59144': {
      // Linea
      id: '59144',
      explorer: 'https://web3.okx.com/explorer/linea/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '1088': {
      // Metis
      id: '1088',
      explorer: 'https://web3.okx.com/explorer/metis/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '1030': {
      // Conflux
      id: '1030',
      explorer: 'https://www.confluxscan.io/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '81457': {
      // Blast
      id: '81457',
      explorer: 'https://web3.okx.com/explorer/blast/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '7000': {
      // Zeta Chain
      id: '7000',
      explorer: 'https://explorer.zetachain.com/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
    '66': {
      // OKT Chain
      id: '66',
      explorer: 'https://www.okx.com/web3/explorer/oktc/tx',
      defaultSlippage: '0.005',
      maxSlippage: '1',
      confirmationTimeout: 60000,
      maxRetries: 3,
    },
  };

  constructor(
    private readonly httpClient: HTTPClient,
    private readonly _config: OKXConfig,
  ) {
    super(httpClient, _config);

    this._config.networks = {
      ...this._defaultNetworkConfigs,
      ...(_config.networks || {}),
    };
  }

  override async executeSwap(params: SwapParams): Promise<SwapResult> {
    const swapData = await this.getSwapData(params);
    const networkConfig = this._getNetworkConfig(params.chainId);

    const executor = new BscSwap(this._config, networkConfig);

    return executor.executeSwap(swapData, params);
  }

  override async executeApproval(
    params: ApproveTokenParams,
  ): Promise<{ transactionHash: string; explorerUrl: string }> {
    try {
      // Get network configuration
      const networkConfig = this._getNetworkConfig(params.chainId);

      // Get the DEX approval address from supported chains
      const chainsData = await this.getChainData(params.chainId);
      const dexTokenApproveAddress = chainsData.data?.[0]?.dexTokenApproveAddress;
      if (!dexTokenApproveAddress) {
        throw new Error(`No dex contract address found for chain ${params.chainId}`);
      }

      // Create the approve executor
      const executor = new EVMApproveExecutor(this._config, networkConfig);

      // Execute approval with the contract address from supported chains
      const result = await executor.handleTokenApproval(
        params.chainId,
        params.tokenContractAddress,
        params.approveAmount,
      );

      // Return formatted result
      return {
        transactionHash: result.transactionHash,
        explorerUrl: `${networkConfig.explorer}/${result.transactionHash}`,
      };
    } catch (error) {
      // Check if it's an "already approved" error, which is not a real error
      if (error instanceof Error && error.message.includes('already approved')) {
        // Return a mock result for already approved tokens
        return {
          transactionHash: '',
          explorerUrl: '',
          alreadyApproved: true,
          message: 'Token already approved for the requested amount',
        } as any;
      }
      // Otherwise, rethrow the error
      throw error;
    }
  }

  private _getNetworkConfig(chainId: string): ChainConfig {
    const networkConfig = this._config.networks?.[chainId];
    if (!networkConfig) {
      throw new Error(`Network configuration not found for chain ${chainId}`);
    }
    return networkConfig;
  }
}

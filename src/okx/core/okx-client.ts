import { BridgeAPI, DexAPI, OKXConfig } from '@okx-dex/okx-dex-sdk';
import { EVMWallet } from '@okx-dex/okx-dex-sdk/dist/core/evm-wallet';
import { env } from '@/env/env';
import { HTTPClient } from '@okx-dex/okx-dex-sdk/dist/core/http-client';
import { OkxDex } from './okx-dex';

export class OKXClient {
  private readonly config: OKXConfig = {
    apiKey: env.OKX_API_KEY,
    secretKey: env.OKX_API_SECRET,
    apiPassphrase: env.OKX_API_PASSPHRASE,
    projectId: env.OKX_PROJECT_ID,
  };

  public dex: DexAPI;

  constructor(wallet: EVMWallet) {
    const client = new OKXDexClient({ ...this.config, evm: { wallet } });
    this.dex = client.dex;
  }
}

class OKXDexClient {
  private config: OKXConfig;
  private httpClient: HTTPClient;
  public dex: OkxDex;
  public bridge: BridgeAPI;

  constructor(config: OKXConfig) {
    this.config = {
      baseUrl: 'https://web3.okx.com',
      maxRetries: 3,
      timeout: 30000,
      ...config,
    };

    this.httpClient = new HTTPClient(this.config);
    this.dex = new OkxDex(this.httpClient, this.config);
    this.bridge = new BridgeAPI(this.httpClient);
  }
}

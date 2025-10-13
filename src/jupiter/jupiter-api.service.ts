import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { tokenV2Schema } from './types/token';
import { priceSchema } from './types/price';
import z from 'zod';
import { env } from '@/env/env';

type RequestOptions<T> = {
  method?: string;
  schema: z.ZodSchema<T>;
};

@Injectable()
export class JupiterApiService {
  private readonly logger = new Logger(JupiterApiService.name);
  private baseUrl = env.JUPITER_API_URL;
  private quoteEndpoint = this.baseUrl + '/swap/v1/quote';
  private swapEndpoint = this.baseUrl + '/swap/v1/swap';
  private searchTokenEndpoint = this.baseUrl + '/tokens/v2/search';
  private priceEndpoint = this.baseUrl + '/price/v3';

  constructor() {}

  private async request<T>(endpoint: string, { method = 'GET', schema }: RequestOptions<T>) {
    const url = this.baseUrl + endpoint;
    const response = await fetch(url, { method });

    if (!response.ok) {
      this.logger.error(`Request failed: ${response.statusText}`);
      throw new InternalServerErrorException('Request failed');
    }

    const result = await response.json();
    const parsedResult = await schema.parseAsync(result);

    return parsedResult;
  }

  async getTokenInfo(mint: string) {
    const [tokenInfo] = await this.request(`${this.searchTokenEndpoint}?query=${mint}`, {
      schema: tokenV2Schema.array(),
    });
    return tokenInfo;
  }

  async getTokenPrice(address: string) {
    const ids = [address, 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'];
    const url = `${this.priceEndpoint}?ids=${ids.join(',')}`;
    const priceMap = await this.request(url, { schema: priceSchema });

    return priceMap[address].usdPrice;
  }
}

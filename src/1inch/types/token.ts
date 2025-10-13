import { hexSchema } from '@/common/utils/zod-schema';
import z from 'zod';

const tagSchema = z.object({
  provider: z.string(),
  value: z.string(),
});

export const tokenInfoSchema = z.object({
  chainId: z.number(),
  symbol: z.string(),
  name: z.string(),
  address: z.string(),
  decimals: z.number(),
  logoURI: z.string(),
  rating: z.number(),
  eip2612: z.boolean().nullish(),
  isFoT: z.boolean().nullish(),
  tags: z.array(tagSchema),
});

export const tokensInfoSchema = z.record(hexSchema, tokenInfoSchema.extend({ tags: z.string().array() }));

export type TokenInfo = z.infer<typeof tokenInfoSchema>;
export type TokensInfo = z.infer<typeof tokensInfoSchema>;

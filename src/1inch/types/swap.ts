import z from 'zod';
import { swapTransactionSchema } from './transaction';

const selectedLiquiditySourceSchema = z.object({
  name: z.string(),
  part: z.number(),
});

const tokenInfoSchema = z.object({
  address: z.string(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.number(),
  logoURI: z.string(),
  domainVersion: z.string(),
  eip2612: z.boolean().nullish(),
  isFoT: z.boolean().nullish(),
  tags: z.string().array(),
});

const tokenHopSchema = z.object({
  part: z.number(),
  dst: z.string(),
  fromTokenId: z.number(),
  toTokenId: z.number(),
  protocols: z.array(selectedLiquiditySourceSchema),
});

const tokenSwapsSchema = z.object({
  token: z.string(),
  hops: z.array(tokenHopSchema),
});

export const swapResponseSchema = z.object({
  srcToken: tokenInfoSchema.optional(),
  dstToken: tokenInfoSchema.optional(),
  dstAmount: z.string(),
  protocol: z.array(tokenSwapsSchema).optional(),
  tx: swapTransactionSchema,
});

export type SwapResponse = z.infer<typeof swapResponseSchema>;

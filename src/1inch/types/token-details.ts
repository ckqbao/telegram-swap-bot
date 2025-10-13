import z from 'zod';

const quoteSchema = z.object({
  price: z.number(),
  volume_24h: z.number(),
  volume_change_24h: z.number(),
  percent_change_1h: z.number(),
  percent_change_24h: z.number(),
  percent_change_7d: z.number(),
  percent_change_30d: z.number(),
  percent_change_60d: z.number(),
  percent_change_90d: z.number(),
  market_cap: z.number(),
  last_updated: z.string(),
});

export const tokenDetailsSchema = z.object({
  provider: z.string(),
  providerURL: z.string(),
  vol24: z.number(),
  marketCap: z.number(),
  circulatingSupply: z.number(),
  totalSupply: z.number(),
  quote: quoteSchema,
});

export type TokenDetails = z.infer<typeof tokenDetailsSchema>;

import z from 'zod';

export const allowanceResponseSchema = z.object({
  allowance: z.string(),
});

export type AllowanceResponse = z.infer<typeof allowanceResponseSchema>;

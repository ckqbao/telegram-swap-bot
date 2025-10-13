import z from 'zod';

export const hexSchema = z.string().startsWith('0x').and(z.custom<`0x${string}`>());

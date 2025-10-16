import z from 'zod';
import { Command } from '../constants/command';

export const callbackButtonDataSchema = z
  .object({
    command: z.enum(Object.values(Command)),
  })
  .catch({ command: Command.DUMMY });

export type CallbackButtonData = z.infer<typeof callbackButtonDataSchema>;

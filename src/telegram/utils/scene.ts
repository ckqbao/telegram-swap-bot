import z from 'zod';
import { Context } from '../interfaces/context.interface';

export async function cleanScene(ctx: Context) {
  const parsed = z.looseObject({ messages: z.array(z.object({ message_id: z.number() })) }).safeParse(ctx.scene.state);

  if (!parsed.success) return;

  const { messages } = parsed.data;
  const messageIds = messages.map((message) => message.message_id);
  await ctx.deleteMessages(messageIds);
}

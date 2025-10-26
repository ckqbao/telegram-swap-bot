import { createListenerDecorator } from 'nestjs-telegraf';
import { Triggers } from 'telegraf/typings/composer';
import { Context } from '../interfaces/context.interface';
import { normaliseTriggers } from '../utils/composer';

const commandDecorator = createListenerDecorator('command');

export function Command<C extends Context>(command: Triggers<C>) {
  return <T>(target: object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
    const deletedMessageSet = new Set<string>();
    const triggers = normaliseTriggers(command);
    const extendedTriggers = triggers.map((trigger) => {
      return (value: string, ctx: C) => {
        const triggerFn = trigger(value, ctx);
        // if (!ctx.chat || !ctx.message) return triggerFn;
        // const deletedMessageKey = `${ctx.chat.id}:${ctx.message.message_id}`;
        // if (!deletedMessageSet.has(deletedMessageKey)) {
        //   ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id).catch(() => null);
        //   deletedMessageSet.add(deletedMessageKey);
        // }
        return triggerFn;
      };
    });
    return commandDecorator(extendedTriggers)(target, propertyKey, descriptor);
  };
}

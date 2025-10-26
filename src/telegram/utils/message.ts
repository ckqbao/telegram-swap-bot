import { Message } from 'telegraf/typings/core/types/typegram';

export function isBotCommand(msg: Message.TextMessage) {
  const { entities } = msg;
  const cmdEntity = entities?.[0];
  return cmdEntity?.type === 'bot_command' && cmdEntity?.offset === 0;
}

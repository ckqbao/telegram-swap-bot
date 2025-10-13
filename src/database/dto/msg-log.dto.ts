export class CreateMsgLogDto {
  chatId: number;
  mint?: string;
  msgId: number;
  parentMsgId?: number;
  tokenAddress?: string;
  username: string;
}

import { ChainKey } from '@/common/constants';

export class CreateMsgLogDto {
  chain?: ChainKey;
  chatId: number;
  mint?: string;
  msgId: number;
  parentMsgId?: number;
  tokenAddress?: string;
  username: string;
}

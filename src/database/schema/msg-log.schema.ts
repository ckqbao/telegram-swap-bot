import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Hex } from 'viem';
import { Base } from './base.schema';

@Schema({ collection: 'msg-logs', timestamps: true })
export class MsgLog extends Base {
  @Prop({ default: 0, required: true })
  chatId: number;

  @Prop({ default: '' })
  mint: string;

  @Prop({ default: 0, required: true })
  msgId: number;

  @Prop({ default: 0 })
  parentMsgId?: number;

  @Prop({ default: '' })
  tokenAddress: Hex;

  @Prop()
  username: string;
}

export const MsgLogSchema = SchemaFactory.createForClass(MsgLog);

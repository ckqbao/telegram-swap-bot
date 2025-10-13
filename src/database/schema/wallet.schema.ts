import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base } from './base.schema';
import { Hex, isHex } from 'viem';

@Schema()
export class Wallet extends Base {
  @Prop({ unique: true })
  address: string;

  @Prop({ unique: true, validate: isHex })
  privateKey: Hex;

  @Prop({ default: false })
  isMain?: boolean;

  @Prop()
  name: string;

  // telegram user id
  @Prop()
  userId: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

WalletSchema.index({ isMain: 1 }, { unique: true, partialFilterExpression: { isMain: true } });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base } from './base.schema';

@Schema()
export class Preference extends Base {
  @Prop({ default: 0.0001 })
  buyGas: number;

  @Prop({ default: 0.0001 })
  sellGas: number;

  @Prop({ default: 5 })
  slippage: number;

  @Prop()
  userId: number;
}

export const PreferenceSchema = SchemaFactory.createForClass(Preference);

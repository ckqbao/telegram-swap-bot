import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChainKey, DEFAULT_CHAIN_KEY } from '@/common/constants';
import { Preference } from '../schema/preference.schema';

@Injectable()
export class PreferenceRepository {
  constructor(@InjectModel(Preference.name) private readonly preferenceModel: Model<Preference>) {}

  async getByUserId(userId: number) {
    const preference = await this.preferenceModel.findOne({ userId }).lean().exec();
    if (preference) return preference;
    return await this.preferenceModel.create({ userId });
  }

  async setBuyAmounts(userId: number, chain: ChainKey, buyAmounts: number[]) {
    await this.getByUserId(userId);
    const update: Record<string, unknown> = { [`buyAmountsByChain.${chain}`]: buyAmounts };
    // keep the legacy flat field in sync so older reads keep working
    if (chain === DEFAULT_CHAIN_KEY) update.buyAmounts = buyAmounts;
    await this.preferenceModel.updateOne({ userId }, update);
  }

  async setChain(userId: number, chain: ChainKey) {
    await this.getByUserId(userId);
    await this.preferenceModel.updateOne({ userId }, { chain });
  }

  async setSlippage(userId: number, slippage: number) {
    await this.getByUserId(userId);
    await this.preferenceModel.updateOne({ userId }, { slippage });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Preference } from '../schema/preference.schema';

@Injectable()
export class PreferenceRepository {
  constructor(@InjectModel(Preference.name) private readonly preferenceModel: Model<Preference>) {}

  async getByUserId(userId: number) {
    const preference = await this.preferenceModel.findOne({ userId }).lean().exec();
    if (preference) return preference;
    return await this.preferenceModel.create({ userId });
  }

  async setSlippage(userId: number, slippage: number) {
    await this.getByUserId(userId);
    await this.preferenceModel.updateOne({ userId }, { slippage });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Wallet } from '../schema/wallet.schema';
import { CreateWalletDto } from '../dto/wallet.dto';

@Injectable()
export class WalletRepository {
  constructor(@InjectModel(Wallet.name) private walletModel: Model<Wallet>) {}

  async getById(walletId: string | Types.ObjectId, userId: number): Promise<Wallet> {
    const wallet = await this.walletModel.findOne({ _id: walletId, userId }).exec();
    if (!wallet) throw new NotFoundException(`Not found wallet by address ${walletId.toString()}`);
    return wallet;
  }

  async getByUserId(userId: number): Promise<Wallet[]> {
    return this.walletModel.find({ userId }).exec();
  }

  async getByAddress(address: string, userId: number): Promise<Wallet> {
    const wallet = await this.walletModel.findOne({ address, userId }).exec();
    if (!wallet) throw new NotFoundException(`Not found wallet by address ${address}`);
    return wallet;
  }

  async getByAddresses(addresses: string[], userId: number): Promise<Wallet[]> {
    return this.walletModel.find({ address: { $in: addresses }, userId }).exec();
  }

  async getOrCreateWallet(createWalletDto: CreateWalletDto): Promise<Wallet> {
    const { address, privateKey, userId } = createWalletDto;
    let wallet = await this.walletModel.findOne({ address, privateKey, userId }).exec();
    if (!wallet) {
      const mainWallet = await this.walletModel.findOne({ isMain: true, userId }).exec();
      wallet = await this.walletModel.create({ ...createWalletDto, isMain: !mainWallet });
    }
    return wallet;
  }

  async setMainWallet(walletId: string | Types.ObjectId, userId: number) {
    await this.walletModel.updateMany({ _id: { $ne: walletId }, userId }, { $unset: { isMain: '' } });
    await this.walletModel.updateOne({ _id: walletId, userId }, { $set: { isMain: true } }, { runValidators: true });
    return await this.getById(walletId, userId);
  }

  async getMainWalletPrivateKeyForUser(userId: number) {
    const wallet = await this.walletModel.findOne({ userId, isMain: true }).exec();
    if (!wallet) throw new NotFoundException(`No main wallet found for user ${userId}`);
    return wallet.privateKey;
  }

  async deleteByAddress(address: string, userId: number) {
    await this.walletModel.deleteOne({ address, userId }).exec();
  }
}

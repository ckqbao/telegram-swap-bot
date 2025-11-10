import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MsgLog } from '../schema/msg-log.schema';
import { FilterQuery, Model } from 'mongoose';
import { CreateMsgLogDto } from '../dto/msg-log.dto';
import { isAddress } from 'viem';

@Injectable()
export class MsgLogRepository {
  constructor(@InjectModel(MsgLog.name) private readonly msgLogModel: Model<MsgLog>) {}

  async createMsgLog(dto: CreateMsgLogDto) {
    return await this.msgLogModel.findOneAndUpdate({ chatId: dto.chatId, username: dto.username }, dto, {
      upsert: true,
    });
  }

  async findMsgLog(filter: FilterQuery<MsgLog>) {
    return this.msgLogModel.findOne(filter);
  }

  async getTokenAddress(chatId: number, msgId: number, username: string = '') {
    const msgLog = await this.msgLogModel.findOne({ chatId, msgId, username });
    if (!msgLog || !isAddress(msgLog.tokenAddress)) throw new Error('Token address not found');
    return msgLog.tokenAddress;
  }
}

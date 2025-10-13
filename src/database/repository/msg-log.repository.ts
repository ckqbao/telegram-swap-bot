import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MsgLog } from '../schema/msg-log.schema';
import { FilterQuery, Model } from 'mongoose';
import { CreateMsgLogDto } from '../dto/msg-log.dto';

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
}

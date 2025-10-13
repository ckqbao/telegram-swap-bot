import { EnvService } from '@/env/env.service';
import { Injectable } from '@nestjs/common';
import { MongooseModuleOptions, MongooseOptionsFactory } from '@nestjs/mongoose';

@Injectable()
export class DatabaseConfigService implements MongooseOptionsFactory {
  constructor(private readonly envService: EnvService) {}

  createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: this.envService.get('DATABASE_URL'),
    };
  }
}

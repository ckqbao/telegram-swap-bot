import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';
import { EnvModule } from './env/env.module';
import { env, envSchema } from './env/env';
import { DatabaseModule } from './database/database.module';
import { MongooseModule } from '@nestjs/mongoose';
import { EnvService } from './env/env.service';
import { DatabaseConfigService } from './database/database-config.service';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      stores: env.REDIS_URL ? [new KeyvRedis(env.REDIS_URL)] : [],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => envSchema.parse(env),
    }),
    DatabaseModule,
    EnvModule,
    MongooseModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useClass: DatabaseConfigService,
    }),
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

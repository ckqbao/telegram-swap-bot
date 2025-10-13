import { Global, Module, Provider } from '@nestjs/common';
import { ModelDefinition, MongooseModule } from '@nestjs/mongoose';
import { MsgLog, MsgLogSchema } from './schema/msg-log.schema';
import * as repositories from './repository';
import { Wallet, WalletSchema } from './schema/wallet.schema';
import { Preference, PreferenceSchema } from './schema/preference.schema';

const MODELS: ModelDefinition[] = [
  { name: MsgLog.name, schema: MsgLogSchema },
  { name: Preference.name, schema: PreferenceSchema },
  { name: Wallet.name, schema: WalletSchema },
];

const repositoryServices: Provider[] = Object.values(repositories);

@Global()
@Module({
  imports: [MongooseModule.forFeature(MODELS)],
  providers: [...repositoryServices],
  exports: [MongooseModule, ...repositoryServices],
})
export class DatabaseModule {}

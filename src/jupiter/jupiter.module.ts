import { Module } from '@nestjs/common';
import { JupiterApiService } from './jupiter-api.service';
import { EnvModule } from '@/env/env.module';

@Module({
  imports: [EnvModule],
  providers: [JupiterApiService],
  exports: [JupiterApiService],
})
export class JupiterModule {}

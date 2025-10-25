import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { OkxSwapService } from './okx-swap.service';

@Module({
  imports: [CommonModule],
  providers: [OkxSwapService],
  exports: [OkxSwapService],
})
export class OkxModule {}

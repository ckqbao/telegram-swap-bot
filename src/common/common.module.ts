import { Module } from '@nestjs/common';
import { viemPublicClientProvider } from './providers';
import { TokenApprovalService } from './services/token-approval.service';

@Module({
  providers: [viemPublicClientProvider, TokenApprovalService],
  exports: [viemPublicClientProvider, TokenApprovalService],
})
export class CommonModule {}

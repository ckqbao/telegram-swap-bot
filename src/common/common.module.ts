import { Module } from '@nestjs/common';
import { viemPublicClientProvider } from './providers';
import { ChainClientService } from './services/chain-client.service';
import { TokenApprovalService } from './services/token-approval.service';

@Module({
  providers: [viemPublicClientProvider, ChainClientService, TokenApprovalService],
  exports: [viemPublicClientProvider, ChainClientService, TokenApprovalService],
})
export class CommonModule {}

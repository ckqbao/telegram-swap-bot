import { Injectable } from '@nestjs/common';
import { copytoclipboard } from '@/common/utils';
import { WalletRepository } from '@/database/repository';
import { Screen } from '../interfaces/screen.interface';

@Injectable()
export class WalletsScreen implements Screen {
  constructor(private readonly walletRepository: WalletRepository) {}

  async buildCaption(userId: number) {
    const wallets = await this.walletRepository.getByUserId(userId);
    const caption = wallets
      .map((wallet) => `<b>${wallet.name}</b> - ${copytoclipboard(wallet.address)} ${wallet.isMain ? '🔥' : ''}`)
      .join('\n');
    return caption;
  }
}

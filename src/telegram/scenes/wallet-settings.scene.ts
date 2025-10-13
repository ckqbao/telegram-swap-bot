import { Inject, UseFilters } from '@nestjs/common';
import { Ctx, Message, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { Update } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { isHex } from 'viem';

import { WalletRepository } from '@/database/repository/wallet.repository';

import { BaseScene } from './base.scene';
import { WALLET_SETTINGS_SCENE } from '../constants/scene';
import { TelegrafExceptionFilter } from '../filters/telegraf-exception.filter';

@Wizard(WALLET_SETTINGS_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class WalletSettingsScene extends BaseScene {
  @Inject()
  private readonly walletRepository: WalletRepository;

  @WizardStep(1)
  async onSceneEnter(@Ctx() ctx: WizardContext) {
    await ctx.reply(
      '⚙️ Wallet Setup',
      Markup.inlineKeyboard([
        Markup.button.callback('Create wallet', 'create-wallet'),
        Markup.button.callback('Import wallet', 'import-wallet'),
      ]),
    );
    ctx.wizard.next();
  }

  @On('callback_query')
  @WizardStep(2)
  async onSetupWallet(@Ctx() ctx: WizardContext & { update: Update.CallbackQueryUpdate }) {
    const cbQuery = ctx.update.callback_query;
    const setup = 'data' in cbQuery ? cbQuery.data : null;
    ctx.scene.state = { setup };
    if (!setup) ctx.scene.reset();
    await ctx.reply('⚙️ Name your wallet', { reply_markup: { force_reply: true } });
    ctx.wizard.next();
  }

  @On('text')
  @WizardStep(3)
  async onNameWallet(@Ctx() ctx: WizardContext, @Message() msg: { text: string }) {
    if (!ctx.from) {
      return this.showUnexpectedError(ctx);
    }
    const { setup } = ctx.scene.state as { setup: string };
    switch (setup) {
      case 'create-wallet': {
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        await this.walletRepository.getOrCreateWallet({
          address: account.address,
          name: msg.text,
          privateKey,
          userId: ctx.from.id,
        });
        await ctx.reply(
          '✅ Successfully Created Wallet\n\n' +
            '⚠️ SAVE YOUR PRIVATE KEY. IF YOU DELETE THIS MESSAGE, WE WILL NOT SHOW YOUR YOUR PRIVATE KEY AGAIN.\n\n' +
            '💡 Private key:\n' +
            '`' +
            privateKey +
            '`',
          {
            parse_mode: 'Markdown',
          },
        );
        await ctx.scene.leave();
        return;
      }
      case 'import-wallet':
        ctx.scene.state = { name: msg.text };
        await ctx.reply('💡 Enter your private key', { reply_markup: { force_reply: true } });
        ctx.wizard.next();
        return;
      default:
        ctx.scene.reset();
        return;
    }
  }

  @On('text')
  @WizardStep(4)
  async onEnterPrivateKey(@Ctx() ctx: WizardContext, @Message() msg: { text: string }) {
    if (!ctx.from) {
      return this.showUnexpectedError(ctx);
    }
    const { name } = ctx.scene.state as { name: string };
    const address = this.getWalletAddress(msg.text);
    if (!address) {
      await ctx.reply('Invalid private key');
      return;
    }
    await this.walletRepository.getOrCreateWallet({ address, name, privateKey: msg.text, userId: ctx.from.id });
    await ctx.deleteMessage(ctx.message?.message_id);
    await ctx.scene.leave();
    return 'imported';
  }

  private getWalletAddress(privateKey: string) {
    if (!isHex(privateKey)) return null;
    try {
      const account = privateKeyToAccount(privateKey);
      return account.address;
    } catch {
      return null;
    }
  }
}

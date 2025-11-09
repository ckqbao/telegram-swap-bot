import { Inject, UseFilters } from '@nestjs/common';
import { Message, User } from '@telegraf/types';
import { Action, Ctx, Message as Msg, Next, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { isHex } from 'viem';
import { SceneEnum } from '@/telegram/enums/scene.enum';
import { Context } from '@/telegram/interfaces/context.interface';
import { setupWalletKeyboard } from '@/telegram/keyboards/wallet-settings.keyboard';
import { TelegrafExceptionFilter } from '@/telegram/filters/telegraf-exception.filter';
import { replyWithTrack } from '@/telegram/utils/message';
import { commonButtons } from '@/telegram/buttons/common.buttons';
import { walletButtons } from '@/telegram/buttons/wallet.buttons';
import { WalletRepository } from '@/database/repository';
import { CtxUser } from '@/telegram/decorator/context-user.decorator';
import { closeKeyboard } from '@/telegram/keyboards/common.keyboard';
import { CallbackQueryData } from '@/telegram/decorator/callback-query-data.decorator';
import { BaseScene } from '../base.scene';

enum SetupWalletSteps {
  ENTER,
  NAME_WALLET,
  ENTER_PRIVATE_KEY,
}

@Wizard(SceneEnum.SETUP_WALLET_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class SetupWalletScene extends BaseScene {
  @Inject()
  private readonly walletRepository: WalletRepository;

  @WizardStep(SetupWalletSteps.ENTER)
  async onSceneEnter(@Ctx() ctx: Context) {
    await replyWithTrack(ctx, '⚙️ Setup Wallet', setupWalletKeyboard());
    return;
  }

  @Action(walletButtons.createWallet.callback)
  @Action(walletButtons.importWallet.callback)
  async onSetupWallet(@Ctx() ctx: Context, @CallbackQueryData() data: string, @Next() next: () => Promise<void>) {
    await this.deleteStepMessages(ctx);
    ctx.scene.state = { ...ctx.scene.state, method: data };
    const msg = await ctx.reply('⚙️ Name your wallet', { reply_markup: { force_reply: true } });
    this.addSceneMessage(ctx, msg);
    await this.selectStep(ctx, SetupWalletSteps.NAME_WALLET, next);
  }

  @WizardStep(SetupWalletSteps.NAME_WALLET)
  @On('text')
  async onNameWallet(@Ctx() ctx: Context, @Msg() msg: Message.TextMessage, @CtxUser() user: User) {
    if (!msg.reply_to_message) {
      await ctx.deleteMessage(msg.message_id);
      return;
    }

    const { method } = ctx.scene.state as { method: string };
    switch (method) {
      case walletButtons.createWallet.callback: {
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        await this.walletRepository.getOrCreateWallet({
          address: account.address,
          name: msg.text,
          privateKey,
          userId: user.id,
        });
        await ctx.deleteMessages([msg.reply_to_message.message_id, msg.message_id]);
        await ctx.reply(
          '✅ Successfully Created Wallet\n\n' +
            '⚠️ SAVE YOUR PRIVATE KEY. IF YOU DELETE THIS MESSAGE, WE WILL NOT SHOW YOUR YOUR PRIVATE KEY AGAIN.\n\n' +
            '💡 Private key:\n' +
            '`' +
            privateKey +
            '`',
          {
            parse_mode: 'Markdown',
            reply_markup: closeKeyboard().reply_markup,
          },
        );
        return;
      }
      case walletButtons.importWallet.callback: {
        ctx.scene.state = { ...ctx.scene.state, name: msg.text };
        await ctx.deleteMessages([msg.reply_to_message.message_id, msg.message_id]);
        const privateKeyMsg = await ctx.reply('💡 Enter your private key', { reply_markup: { force_reply: true } });
        this.addSceneMessage(ctx, privateKeyMsg);
        ctx.wizard.next();
        return;
      }
      default:
        ctx.scene.reset();
        return;
    }
  }

  @WizardStep(SetupWalletSteps.ENTER_PRIVATE_KEY)
  @On('text')
  async onEnterPrivateKey(@Ctx() ctx: Context, @Msg() msg: Message.TextMessage, @CtxUser() user: User) {
    if (!msg.reply_to_message) {
      await ctx.deleteMessage(msg.message_id);
      return;
    }

    const { name } = ctx.scene.state as { name: string };
    const address = this.getWalletAddress(msg.text);
    if (!address) {
      await ctx.deleteMessages([msg.reply_to_message.message_id, msg.message_id]);
      const invalidInputMsg = await ctx.reply('⚠︎ Invalid input, try again\n\n💡 Enter your private key', {
        parse_mode: 'Markdown',
        reply_markup: { force_reply: true },
      });
      this.addSceneMessage(ctx, invalidInputMsg);
      return;
    }

    await this.walletRepository.getOrCreateWallet({ address, name, privateKey: msg.text, userId: user.id });
    await ctx.deleteMessages([msg.reply_to_message.message_id, msg.message_id]);
    await ctx.reply('Wallet imported successfully.', closeKeyboard());
    await ctx.scene.reenter();
    return;
  }

  @Action(commonButtons.back.callback)
  async back(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.WALLET_SETTINGS_SCENE);
  }

  @Action(commonButtons.close.callback)
  async close(@Ctx() ctx: Context) {
    await ctx.deleteMessage();
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

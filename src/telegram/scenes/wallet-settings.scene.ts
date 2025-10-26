import { Inject, UseFilters } from '@nestjs/common';
import { Ctx, Message, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { CallbackQuery, Message as TgMessage, Update } from 'telegraf/typings/core/types/typegram';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { isHex } from 'viem';

import { WalletRepository } from '@/database/repository/wallet.repository';

import { BaseScene } from './base.scene';
import { Command } from '../constants/command';
import { SceneEnum } from '../enums/scene.enum';
import { TelegrafExceptionFilter } from '../filters/telegraf-exception.filter';
import { Context } from '../interfaces/context.interface';
import { callbackButtonDataSchema } from '../types/callback-button-data';
import { buildCancelKeyboard, buildCloseKeyboard, buildInlineKeyboard } from '../utils/inline-keyboard';

enum WalletSettingsSteps {
  ENTER,
  SETUP_WALLET,
  NAME_WALLET,
  ENTER_PRIVATE_KEY,
}

@Wizard(SceneEnum.WALLET_SETTINGS_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class WalletSettingsScene extends BaseScene {
  @Inject()
  private readonly walletRepository: WalletRepository;

  @WizardStep(WalletSettingsSteps.ENTER)
  async onSceneEnter(@Ctx() ctx: Context) {
    const message = await ctx.reply('⚙️ Wallet Setup', {
      reply_markup: {
        inline_keyboard: [
          ...buildInlineKeyboard([
            [
              { text: 'Create wallet', command: Command.CREATE_WALLET },
              { text: 'Import wallet', command: Command.IMPORT_WALLET },
            ],
          ]),
          ...buildCancelKeyboard(),
        ],
      },
    });
    this.addMessageToState(ctx, message);
    ctx.wizard.next();
  }

  @On('callback_query')
  @WizardStep(WalletSettingsSteps.SETUP_WALLET)
  async onSetupWallet(@Ctx() ctx: Context & { update: Update.CallbackQueryUpdate<CallbackQuery.DataQuery> }) {
    const { data } = ctx.update.callback_query;
    const parsedData = callbackButtonDataSchema.parse(JSON.parse(data));

    switch (parsedData.command) {
      case Command.CANCEL:
        return this.abortScene(ctx);
      case Command.CREATE_WALLET:
      case Command.IMPORT_WALLET: {
        ctx.scene.state = { ...ctx.scene.state, setup: parsedData.command };
        const message = await ctx.reply('⚙️ Name your wallet', { reply_markup: { force_reply: true } });
        this.addMessageToState(ctx, message);
        ctx.wizard.next();
        break;
      }
      default:
        return await this.abortScene(ctx);
    }
  }

  @On('text')
  @WizardStep(WalletSettingsSteps.NAME_WALLET)
  async onNameWallet(@Ctx() ctx: Context, @Message() msg: TgMessage.TextMessage) {
    this.addMessageToState(ctx, msg);
    if (!ctx.from) {
      return this.showUnexpectedError(ctx);
    }
    const { setup } = ctx.scene.state as { setup: string };
    switch (setup) {
      case Command.CREATE_WALLET: {
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
            reply_markup: { inline_keyboard: buildCloseKeyboard() },
          },
        );
        return await ctx.scene.leave();
      }
      case Command.IMPORT_WALLET: {
        ctx.scene.state = { ...ctx.scene.state, name: msg.text };
        const message = await ctx.reply('💡 Enter your private key', { reply_markup: { force_reply: true } });
        this.addMessageToState(ctx, message);
        ctx.wizard.next();
        break;
      }
      default:
        ctx.scene.reset();
        break;
    }
  }

  @On('text')
  @WizardStep(WalletSettingsSteps.ENTER_PRIVATE_KEY)
  async onEnterPrivateKey(@Ctx() ctx: Context, @Message() msg: TgMessage.TextMessage) {
    this.addMessageToState(ctx, msg);
    if (!ctx.from) {
      return this.showUnexpectedError(ctx);
    }
    const { name } = ctx.scene.state as { name: string };
    const address = this.getWalletAddress(msg.text);
    if (!address) {
      await ctx.reply('Invalid private key');
      return await ctx.scene.leave();
    }
    await this.walletRepository.getOrCreateWallet({ address, name, privateKey: msg.text, userId: ctx.from.id });
    await ctx.scene.leave();
    await ctx.reply('Wallet imported successfully.', {
      reply_markup: { inline_keyboard: buildCloseKeyboard() },
    });
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

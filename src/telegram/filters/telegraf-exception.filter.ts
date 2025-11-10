import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { TelegrafArgumentsHost } from 'nestjs-telegraf';
import { Context } from '../interfaces/context.interface';
import { closeKeyboard } from '../keyboards/common.keyboard';

@Catch()
export class TelegrafExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TelegrafExceptionFilter.name);

  async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    this.logger.error(exception.message);
    const telegrafHost = TelegrafArgumentsHost.create(host);
    const ctx = telegrafHost.getContext<Context>();

    await ctx.replyWithHTML(
      `${exception.message}\n` + '💡<i>If you have any questions, please contact admin: baochow95@gmail.com</i>',
      closeKeyboard(),
    );
  }
}

import { Injectable } from '@nestjs/common';
import { Screen } from '../interfaces/screen.interface';

@Injectable()
export class WelcomeScreen implements Screen {
  constructor() {}

  buildCaption() {
    const caption =
      `<b>Welcome to CKQB Swap Bot</b>\n\n` + `💡 <em>Paste a token address to trigger the Buy/Sell Menu</em>`;
    return caption;
  }
}

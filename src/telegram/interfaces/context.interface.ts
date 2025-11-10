import { Cache } from 'cache-manager';
import { Context as TelegrafContext, Scenes } from 'telegraf';

interface Session extends Scenes.WizardSession {
  inlineKeyboardMenuMsgId?: number;
  dataQueryRepliedMessage?: {
    data: string;
    parentMsgId?: number;
    msgId: number;
  };
}

export interface Context extends TelegrafContext {
  cacheManager: Cache;
  session: Session;
  scene: Scenes.SceneContextScene<Context, Scenes.WizardSessionData>;
  wizard: Scenes.WizardContextWizard<Context>;
}

import { Cache } from 'cache-manager';
import { Scenes } from 'telegraf';

export interface Context extends Scenes.WizardContext {
  cacheManager: Cache;
}

import { Context } from 'telegraf';
import { Triggers } from 'telegraf/typings/composer';

function escapeRegExp(s: string) {
  // $& means the whole matched string
  return s.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

export function normaliseTriggers<C extends Context>(triggers: Triggers<C>) {
  if (!Array.isArray(triggers)) triggers = [triggers];

  return triggers.map((trigger) => {
    if (!trigger) throw new Error('Invalid trigger');
    if (typeof trigger === 'function') return trigger;

    if (trigger instanceof RegExp)
      return (value = '') => {
        trigger.lastIndex = 0;
        return trigger.exec(value);
      };

    const regex = new RegExp(`^${escapeRegExp(trigger)}$`);
    return (value: string) => regex.exec(value);
  });
}

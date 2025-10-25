export * from './links';
export * from './price';

export const copytoclipboard = (text: string) => {
  return `<code class="text-entity-code clickable" role="textbox" tabindex="0" data-entity-type="MessageEntityCode">${text}</code>`;
};

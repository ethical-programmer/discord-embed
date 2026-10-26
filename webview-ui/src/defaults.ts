import type { Embed, EmbedButton, Prefs, SavedState, V2Block, V2Message } from '../../shared/protocol';

export const newId = () => Math.random().toString(36).slice(2, 10);

// Same values as exampleRef() in examples.ts; spelled out so this file doesn't pull in the SVGs.
const AVATAR = 'example:avatar';
const BANNER = 'example:banner';
const THUMBNAIL = 'example:thumbnail';

export type ImagePart = 'authorIcon' | 'image' | 'thumbnail' | 'footerIcon';
export type TextPart = 'authorName' | 'title' | 'description' | 'footerText';
export type OptionalPart = ImagePart | TextPart | 'timestamp';

const IMAGE_PARTS: string[] = ['authorIcon', 'image', 'thumbnail', 'footerIcon'] satisfies ImagePart[];
export const isImagePart = (part: string): part is ImagePart => IMAGE_PARTS.includes(part);

/** Values a part gets when it's added back from the "Add" menu. */
export const PART_DEFAULTS: Record<ImagePart | TextPart, string> = {
  authorIcon: AVATAR,
  authorName: 'Author Name',
  title: 'Embed Title',
  description: 'This is an example description for the Discord embed.',
  image: BANNER,
  thumbnail: THUMBNAIL,
  footerIcon: AVATAR,
  footerText: 'Footer Text',
};

export function newButton(existing: EmbedButton[]): EmbedButton {
  const taken = new Set(existing.map((b) => b.customId));
  let n = existing.length + 1;
  while (taken.has(`button_${n}`)) n++;
  return { id: newId(), label: 'New Button', style: 'Primary', customId: `button_${n}`, url: '' };
}

export function defaultEmbed(): Embed {
  return {
    color: '#5865F2',
    authorIcon: AVATAR,
    authorName: 'My Community',
    title: '✨ Welcome to the server!',
    description:
      "We're **really glad** you're here! Pick your roles, read the rules and come say hi in `#general`.\n-# Click any part of this embed to make it yours. Markdown works here too.",
    fields: [
      { id: newId(), name: '📅 Events', value: 'Game nights every Friday at 8 PM', inline: true },
      { id: newId(), name: '🎁 Giveaways', value: 'Weekly Nitro drops for members', inline: true },
      { id: newId(), name: '🛡️ Rules', value: 'Be kind, no spam, keep it friendly.', inline: false },
    ],
    image: BANNER,
    thumbnail: THUMBNAIL,
    footerIcon: AVATAR,
    footerText: 'My Community • Made with Discord Embed',
    timestamp: true,
    buttons: [
      { id: newId(), label: 'Get Roles', style: 'Success', customId: 'get_roles', url: '' },
      { id: newId(), label: 'Read Rules', style: 'Secondary', customId: 'read_rules', url: '' },
      { id: newId(), label: 'Website', style: 'Link', customId: '', url: 'https://discord.com' },
    ],
  };
}

export type V2BlockKind = 'text' | 'section-thumbnail' | 'section-button' | 'gallery' | 'separator' | 'buttons';

/** Every button in a V2 message, in rows and section accessories (custom IDs must be unique across all of them). */
export function v2Buttons(message: V2Message): EmbedButton[] {
  return message.blocks.flatMap((b) =>
    b.type === 'buttons' ? b.buttons : b.type === 'section' && b.accessory === 'button' ? [b.button] : []
  );
}

export function newBlock(kind: V2BlockKind, message: V2Message): V2Block {
  const id = newId();
  const button = newButton(v2Buttons(message));
  switch (kind) {
    case 'text':
      return { id, type: 'text', content: '### New heading\nWrite something here. **Markdown** works too.' };
    case 'section-thumbnail':
      return { id, type: 'section', texts: ['### Section title', 'Text that sits next to the thumbnail.'], accessory: 'thumbnail', thumbnail: THUMBNAIL, button };
    case 'section-button':
      return { id, type: 'section', texts: ['Text that sits next to the button.'], accessory: 'button', thumbnail: THUMBNAIL, button: { ...button, label: 'Click me' } };
    case 'gallery':
      return { id, type: 'gallery', items: [{ id: newId(), url: BANNER }] };
    case 'separator':
      return { id, type: 'separator', divider: true, spacing: 'small' };
    case 'buttons':
      return { id, type: 'buttons', buttons: [button] };
  }
}

export function defaultMessage(): V2Message {
  return {
    container: true,
    accentColor: '#5865F2',
    spoiler: false,
    blocks: [
      {
        id: newId(),
        type: 'section',
        texts: ['## ✨ Welcome to My Community', "We're really glad you're here. Pick your roles, read the rules and come say hi in #general."],
        accessory: 'thumbnail',
        thumbnail: AVATAR,
        button: { id: newId(), label: 'Open', style: 'Primary', customId: 'open', url: '' },
      },
      { id: newId(), type: 'separator', divider: true, spacing: 'small' },
      {
        id: newId(),
        type: 'text',
        content: '**📅 Events:** Game nights every Friday at 8 PM\n**🎁 Giveaways:** Weekly Nitro drops for members\n**🛡️ Rules:** Be kind, no spam, keep it friendly.',
      },
      { id: newId(), type: 'gallery', items: [{ id: newId(), url: BANNER }] },
      {
        id: newId(),
        type: 'section',
        texts: ['-# Need help? Open a ticket and our team will reply soon.'],
        accessory: 'button',
        thumbnail: THUMBNAIL,
        button: { id: newId(), label: 'Open Ticket', style: 'Primary', customId: 'open_ticket', url: '' },
      },
      { id: newId(), type: 'separator', divider: true, spacing: 'small' },
      {
        id: newId(),
        type: 'buttons',
        buttons: [
          { id: newId(), label: 'Get Roles', style: 'Success', customId: 'get_roles', url: '' },
          { id: newId(), label: 'Read Rules', style: 'Secondary', customId: 'read_rules', url: '' },
          { id: newId(), label: 'Website', style: 'Link', customId: '', url: 'https://discord.com' },
        ],
      },
    ],
  };
}

export const defaultPrefs: Prefs = { theme: 'auto', zoom: 1 };

/** Rebuilds the state saved by an earlier session, or starts fresh. */
export function restoreState(saved: SavedState | undefined): SavedState {
  if (!saved || saved.version !== 2 || !saved.embed) {
    return { version: 2, mode: 'embed', embed: defaultEmbed(), message: defaultMessage(), prefs: defaultPrefs };
  }
  // Don't merge defaults into the embed: removed parts are missing on purpose.
  return {
    version: 2,
    mode: saved.mode ?? 'embed',
    embed: { ...saved.embed, fields: saved.embed.fields ?? [], buttons: saved.embed.buttons ?? [] },
    // Saves from before Components V2 support have no message yet.
    message: saved.message ?? defaultMessage(),
    prefs: { ...defaultPrefs, ...saved.prefs },
  };
}

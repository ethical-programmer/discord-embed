import type { EmbedButton, V2Message } from '../../shared/protocol';
import { buttonBuilderCode, isUsableButton, requireLine, toApiButton } from './codegen';
import { v2Buttons } from './defaults';
import { isExampleRef, isImageUrl } from './limits';

// Components V2 limits, from Discord's component reference.
export const V2_LIMITS = {
  components: 40,
  text: 4000,
  sectionTexts: 3,
  galleryItems: 10,
  rowButtons: 5,
} as const;

export const IS_COMPONENTS_V2 = 1 << 15;

/**
 * What actually gets sent, after leaving out what Discord would reject:
 * empty text, unusable buttons, and images that aren't public URLs.
 * A section whose accessory is unusable falls back to plain Text Displays.
 */
type Node =
  | { type: 'text'; content: string }
  | { type: 'separator'; divider: boolean; large: boolean }
  | { type: 'section'; texts: string[]; thumbnail?: string; button?: EmbedButton }
  | { type: 'gallery'; urls: string[] }
  | { type: 'buttons'; buttons: EmbedButton[] };

function toNodes(message: V2Message): Node[] {
  return message.blocks.flatMap((block): Node[] => {
    switch (block.type) {
      case 'text':
        return block.content.trim() ? [{ type: 'text', content: block.content }] : [];
      case 'separator':
        return [{ type: 'separator', divider: block.divider, large: block.spacing === 'large' }];
      case 'section': {
        const texts = block.texts.filter((t) => t.trim());
        if (!texts.length) return [];
        if (block.accessory === 'thumbnail' && isImageUrl(block.thumbnail)) return [{ type: 'section', texts, thumbnail: block.thumbnail }];
        if (block.accessory === 'button' && isUsableButton(block.button)) return [{ type: 'section', texts, button: block.button }];
        return texts.map((content) => ({ type: 'text', content }));
      }
      case 'gallery': {
        const urls = block.items.map((i) => i.url).filter(isImageUrl);
        return urls.length ? [{ type: 'gallery', urls }] : [];
      }
      case 'buttons': {
        const buttons = block.buttons.filter(isUsableButton);
        return buttons.length ? [{ type: 'buttons', buttons }] : [];
      }
    }
  });
}

const textJson = (content: string) => ({ type: 10, content });

function nodeJson(node: Node): object {
  switch (node.type) {
    case 'text':
      return textJson(node.content);
    case 'separator':
      return { type: 14, divider: node.divider, spacing: node.large ? 2 : 1 };
    case 'section':
      return {
        type: 9,
        components: node.texts.map(textJson),
        accessory: node.button ? toApiButton(node.button) : { type: 11, media: { url: node.thumbnail } },
      };
    case 'gallery':
      return { type: 12, items: node.urls.map((url) => ({ media: { url } })) };
    case 'buttons':
      return { type: 1, components: node.buttons.map(toApiButton) };
  }
}

const accentInt = (hex: string) => parseInt(hex.slice(1), 16);

/** A message payload for `channel.send()`, webhooks, or the REST API. */
export function toV2Json(message: V2Message): string {
  const children = toNodes(message).map(nodeJson);
  const components = message.container
    ? [{ type: 17, accent_color: accentInt(message.accentColor), ...(message.spoiler ? { spoiler: true } : {}), components: children }]
    : children;
  return JSON.stringify({ flags: IS_COMPONENTS_V2, components }, null, 2);
}

/** The discord.js builder for one node, as lines (continuation lines indented 4). */
function nodeBuilder(node: Node, names: Set<string>): { method: string; lines: string[] } {
  const q = JSON.stringify;
  const text = (content: string) => {
    names.add('TextDisplayBuilder');
    return `new TextDisplayBuilder().setContent(${q(content)})`;
  };
  const button = (b: EmbedButton) => {
    names.add('ButtonBuilder').add('ButtonStyle');
    return buttonBuilderCode(b);
  };

  switch (node.type) {
    case 'text':
      return { method: 'addTextDisplayComponents', lines: [text(node.content)] };
    case 'separator':
      names.add('SeparatorBuilder').add('SeparatorSpacingSize');
      return {
        method: 'addSeparatorComponents',
        lines: [`new SeparatorBuilder().setDivider(${node.divider}).setSpacing(SeparatorSpacingSize.${node.large ? 'Large' : 'Small'})`],
      };
    case 'section': {
      names.add('SectionBuilder');
      let accessory: string;
      if (node.button) {
        accessory = `.setButtonAccessory(${button(node.button)})`;
      } else {
        names.add('ThumbnailBuilder');
        accessory = `.setThumbnailAccessory(new ThumbnailBuilder().setURL(${q(node.thumbnail)}))`;
      }
      return {
        method: 'addSectionComponents',
        lines: ['new SectionBuilder()', '    .addTextDisplayComponents(', ...node.texts.map((t) => `        ${text(t)},`), '    )', `    ${accessory}`],
      };
    }
    case 'gallery':
      names.add('MediaGalleryBuilder').add('MediaGalleryItemBuilder');
      return {
        method: 'addMediaGalleryComponents',
        lines: ['new MediaGalleryBuilder().addItems(', ...node.urls.map((u) => `    new MediaGalleryItemBuilder().setURL(${q(u)}),`), ')'],
      };
    case 'buttons':
      names.add('ActionRowBuilder');
      return {
        method: 'addActionRowComponents',
        lines: ['new ActionRowBuilder().addComponents(', ...node.buttons.map((b) => `    ${button(b)},`), ')'],
      };
  }
}

const indent = (lines: string[], spaces: number) => lines.map((l) => ' '.repeat(spaces) + l);

/**
 * discord.js v14 code (v14.19 or later) that builds the message, split into the
 * import line (which belongs at the top of the user's file) and the rest.
 */
export function toV2BuilderCode(message: V2Message): { imports: string; body: string } {
  const names = new Set<string>();
  const built = toNodes(message).map((node) => nodeBuilder(node, names));
  names.add('MessageFlags');
  const lines: string[] = [];

  if (message.container) {
    names.add('ContainerBuilder');
    lines.push('const container = new ContainerBuilder()', `    .setAccentColor(0x${message.accentColor.slice(1).toUpperCase()})`);
    if (message.spoiler) lines.push('    .setSpoiler(true)');
    for (const { method, lines: expr } of built) {
      const body = indent(expr, 8);
      body[body.length - 1] += ',';
      lines.push(`    .${method}(`, ...body, '    )');
    }
    lines[lines.length - 1] += ';';
    lines.push('', '// Send it, e.g. inside a slash-command handler:', 'await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });');
  } else {
    lines.push('const components = [');
    for (const { lines: expr } of built) {
      const body = indent(expr, 4);
      body[body.length - 1] += ',';
      lines.push(...body);
    }
    lines.push('];', '', '// Send it, e.g. inside a slash-command handler:', 'await interaction.reply({ components, flags: MessageFlags.IsComponentsV2 });');
  }

  return { imports: requireLine([...names]), body: lines.join('\n') };
}

/** Components Discord counts toward the 40 limit, including nested ones. */
export function countComponents(message: V2Message): number {
  const nodes = toNodes(message);
  return (
    (message.container ? 1 : 0) +
    nodes.reduce((n, node) => {
      switch (node.type) {
        case 'section':
          return n + 1 + node.texts.length + 1;
        case 'buttons':
          return n + 1 + node.buttons.length;
        default:
          return n + 1;
      }
    }, 0)
  );
}

/** Problems that would make Discord reject the message, or parts the code leaves out. */
export function getV2Warnings(message: V2Message): string[] {
  const warnings: string[] = [];
  const nodes = toNodes(message);
  if (!nodes.some((n) => n.type !== 'separator')) {
    warnings.push('The message is empty. Add text, a section, a gallery or buttons.');
  }

  const images = message.blocks.flatMap((b) =>
    b.type === 'gallery' ? b.items.map((i) => i.url) : b.type === 'section' && b.accessory === 'thumbnail' ? [b.thumbnail] : []
  );
  if (images.some(isExampleRef)) {
    warnings.push('Example images only show in this preview and are left out. Paste your own image URLs to include them.');
  }
  if (images.some((url) => url.trim() && !isExampleRef(url) && !isImageUrl(url))) {
    warnings.push('Some image URLs are not valid http(s) URLs and are left out.');
  }
  const fallback = message.blocks.some(
    (b) => b.type === 'section' && b.texts.some((t) => t.trim()) && (b.accessory === 'thumbnail' ? !isImageUrl(b.thumbnail) : !isUsableButton(b.button))
  );
  if (fallback) {
    warnings.push('Sections need a usable thumbnail or button, so sections without one are sent as plain text.');
  }

  const buttons = v2Buttons(message);
  const skipped = buttons.filter((b) => !isUsableButton(b)).length;
  if (skipped) warnings.push(`${skipped} button(s) are left out because they're missing a label, custom ID or valid URL.`);
  const ids = buttons.filter((b) => b.style !== 'Link').map((b) => b.customId);
  if (new Set(ids).size !== ids.length) warnings.push('Two buttons share a custom ID; Discord needs each one to be unique.');

  const count = countComponents(message);
  if (count > V2_LIMITS.components) {
    warnings.push(`The message has ${count} components; Discord allows ${V2_LIMITS.components}, counting ones inside containers and sections.`);
  }
  const text = nodes.reduce((n, node) => n + (node.type === 'text' ? node.content.length : node.type === 'section' ? node.texts.join('').length : 0), 0);
  if (text > V2_LIMITS.text) {
    warnings.push(`The message has ${text} characters of text; Discord allows ${V2_LIMITS.text} across all Text Displays.`);
  }
  return warnings;
}

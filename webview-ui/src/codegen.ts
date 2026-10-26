import type { ButtonStyle, Embed, EmbedButton } from '../../shared/protocol';
import { LIMITS, isExampleRef, isImageUrl, isLinkUrl } from './limits';

interface ApiEmbed {
  color: number;
  author?: { name: string; icon_url?: string };
  title?: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  image?: { url: string };
  thumbnail?: { url: string };
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
}

const STYLE_CODES: Record<ButtonStyle, number> = { Primary: 1, Secondary: 2, Success: 3, Danger: 4, Link: 5 };

const IMAGE_PARTS = [
  ['authorIcon', 'Author icon'],
  ['image', 'Image'],
  ['thumbnail', 'Thumbnail'],
  ['footerIcon', 'Footer icon'],
] as const;

const usableUrl = (url: string | undefined) => (url && isImageUrl(url) ? url : undefined);

export const isUsableButton = (b: EmbedButton) =>
  b.label.trim() !== '' && (b.style === 'Link' ? isLinkUrl(b.url) : b.customId.trim() !== '');

/** The embed as Discord's API expects it, with empty or invalid parts left out. */
export function toApiEmbed(embed: Embed, now = new Date()): ApiEmbed {
  const out: ApiEmbed = { color: parseInt(embed.color.slice(1), 16) };
  if (embed.authorName) {
    const icon = usableUrl(embed.authorIcon);
    out.author = icon ? { name: embed.authorName, icon_url: icon } : { name: embed.authorName };
  }
  if (embed.title) out.title = embed.title;
  if (embed.description) out.description = embed.description;
  const fields = embed.fields.filter((f) => f.name && f.value);
  if (fields.length) {
    out.fields = fields.map((f) => (f.inline ? { name: f.name, value: f.value, inline: true } : { name: f.name, value: f.value }));
  }
  const image = usableUrl(embed.image);
  if (image) out.image = { url: image };
  const thumbnail = usableUrl(embed.thumbnail);
  if (thumbnail) out.thumbnail = { url: thumbnail };
  if (embed.footerText) {
    const icon = usableUrl(embed.footerIcon);
    out.footer = icon ? { text: embed.footerText, icon_url: icon } : { text: embed.footerText };
  }
  if (embed.timestamp) out.timestamp = now.toISOString();
  return out;
}

/** A button as Discord's API expects it. */
export function toApiButton(b: EmbedButton) {
  return b.style === 'Link'
    ? { type: 2, style: STYLE_CODES.Link, label: b.label, url: b.url }
    : { type: 2, style: STYLE_CODES[b.style], label: b.label, custom_id: b.customId };
}

/** A discord.js expression that builds the button. */
export function buttonBuilderCode(b: EmbedButton): string {
  const q = JSON.stringify;
  const target = b.style === 'Link' ? `.setURL(${q(b.url)})` : `.setCustomId(${q(b.customId)})`;
  return `new ButtonBuilder()${target}.setLabel(${q(b.label)}).setStyle(ButtonStyle.${b.style})`;
}

/** The discord.js require line, one name per line when it would get long. */
export function requireLine(names: string[]): string {
  const line = `const { ${names.join(', ')} } = require('discord.js');`;
  return line.length <= 90 ? line : `const {\n${names.map((n) => `    ${n},`).join('\n')}\n} = require('discord.js');`;
}

/** A message payload for `channel.send()`, webhooks, or the REST API. */
export function toMessageJson(embed: Embed, now = new Date()): string {
  const payload: Record<string, unknown> = { embeds: [toApiEmbed(embed, now)] };
  const buttons = embed.buttons.filter(isUsableButton);
  if (buttons.length) payload.components = [{ type: 1, components: buttons.map(toApiButton) }];
  return JSON.stringify(payload, null, 2);
}

/**
 * discord.js v14 code that builds the embed and its buttons, split into the
 * import line (which belongs at the top of the user's file) and the rest.
 */
export function toBuilderCode(embed: Embed): { imports: string; body: string } {
  const q = (s: string) => JSON.stringify(s);
  const api = toApiEmbed(embed);
  const buttons = embed.buttons.filter(isUsableButton);

  const lines = ['const embed = new EmbedBuilder()'];
  const call = (s: string) => lines.push(`    ${s}`);
  call(`.setColor(0x${embed.color.slice(1).toUpperCase()})`);
  if (api.author) {
    const icon = api.author.icon_url ? `, iconURL: ${q(api.author.icon_url)}` : '';
    call(`.setAuthor({ name: ${q(api.author.name)}${icon} })`);
  }
  if (api.title) call(`.setTitle(${q(api.title)})`);
  if (api.description) call(`.setDescription(${q(api.description)})`);
  if (api.thumbnail) call(`.setThumbnail(${q(api.thumbnail.url)})`);
  if (api.fields) {
    call('.addFields(');
    for (const f of api.fields) {
      lines.push(`        { name: ${q(f.name)}, value: ${q(f.value)}${f.inline ? ', inline: true' : ''} },`);
    }
    call(')');
  }
  if (api.image) call(`.setImage(${q(api.image.url)})`);
  if (api.footer) {
    const icon = api.footer.icon_url ? `, iconURL: ${q(api.footer.icon_url)}` : '';
    call(`.setFooter({ text: ${q(api.footer.text)}${icon} })`);
  }
  if (api.timestamp) call('.setTimestamp()');
  lines[lines.length - 1] += ';';

  const names = ['EmbedBuilder'];
  if (buttons.length) names.push('ActionRowBuilder', 'ButtonBuilder', 'ButtonStyle');

  if (buttons.length) {
    lines.push('', 'const row = new ActionRowBuilder().addComponents(');
    for (const b of buttons) lines.push(`    ${buttonBuilderCode(b)},`);
    lines.push(');');
  }

  lines.push(
    '',
    '// Send it, e.g. inside a slash-command handler:',
    `await interaction.reply({ embeds: [embed]${buttons.length ? ', components: [row]' : ''} });`
  );
  return { imports: requireLine(names), body: lines.join('\n') };
}

/** Problems that would make Discord reject the embed, or parts the code leaves out. */
export function getWarnings(embed: Embed): string[] {
  const warnings: string[] = [];
  const api = toApiEmbed(embed);

  if (!api.author && !api.title && !api.description && !api.fields && !api.image && !api.thumbnail && !api.footer) {
    warnings.push('The embed is empty. Discord needs at least a title, description, field, image, author or footer.');
  }
  if (embed.authorIcon !== undefined && !embed.authorName) {
    warnings.push('The author icon is left out: Discord only shows it next to an author name.');
  }
  if (embed.footerIcon !== undefined && !embed.footerText) {
    warnings.push('The footer icon is left out: Discord only shows it next to footer text.');
  }
  const examples: string[] = [];
  for (const [key, label] of IMAGE_PARTS) {
    const url = embed[key];
    if (isExampleRef(url)) examples.push(label.toLowerCase());
    else if (url !== undefined && !isImageUrl(url)) warnings.push(`${label} URL is not a valid http(s) URL and is left out.`);
  }
  if (examples.length) {
    warnings.push(
      `Example images only show in this preview, so the ${examples.join(', ')} ${examples.length > 1 ? 'are' : 'is'} left out. Paste your own image URL to include ${examples.length > 1 ? 'them' : 'it'}.`
    );
  }

  const total = [embed.title, embed.description, embed.authorName, embed.footerText, ...embed.fields.flatMap((f) => [f.name, f.value])]
    .join('').length;
  if (total > LIMITS.total) {
    warnings.push(`The embed has ${total} characters of text; Discord allows ${LIMITS.total} in total.`);
  }

  const skipped = embed.buttons.filter((b) => !isUsableButton(b)).length;
  if (skipped) warnings.push(`${skipped} button(s) are left out because they're missing a label, custom ID or valid URL.`);
  const ids = embed.buttons.filter((b) => b.style !== 'Link').map((b) => b.customId);
  if (new Set(ids).size !== ids.length) warnings.push('Two buttons share a custom ID; Discord needs each one to be unique.');

  return warnings;
}

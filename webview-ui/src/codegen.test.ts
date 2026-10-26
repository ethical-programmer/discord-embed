import { describe, expect, it } from 'vitest';
import type { Embed } from '../../shared/protocol';
import { getWarnings, toBuilderCode, toMessageJson } from './codegen';
import { tokenize } from './highlight';
import { fieldSpans, move } from './layout';

const base: Embed = { color: '#5865F2', fields: [], buttons: [], timestamp: false };
const now = new Date('2026-01-01T00:00:00.000Z');

// The full file a user ends up with: the import line, then the body.
const builderFile = (embed: Embed) => {
  const { imports, body } = toBuilderCode(embed);
  return `${imports}\n\n${body}`;
};

describe('toBuilderCode', () => {
  it('keeps the require line separate and imports only what is used', () => {
    expect(toBuilderCode({ ...base, title: 'Hi' }).imports).toBe("const { EmbedBuilder } = require('discord.js');");
    expect(toBuilderCode({ ...base, title: 'Hi' }).body).not.toContain('require');
  });

  it('escapes quotes and newlines so the code still runs', () => {
    const code = builderFile({ ...base, title: `Bob's "bot"`, description: 'line 1\nline 2' });
    expect(code).toContain(`.setTitle("Bob's \\"bot\\"")`);
    expect(code).toContain('.setDescription("line 1\\nline 2")');
    expect(() => new Function(`return async () => {\n${code}\n}`)).not.toThrow();
  });

  it('gives buttons a custom ID or URL and puts them in an action row', () => {
    const code = builderFile({
      ...base,
      title: 'Hi',
      buttons: [
        { id: 'a', label: 'Go', style: 'Success', customId: 'go', url: '' },
        { id: 'b', label: 'Docs', style: 'Link', customId: '', url: 'https://discord.js.org' },
      ],
    });
    expect(code).toContain('.setCustomId("go").setLabel("Go").setStyle(ButtonStyle.Success)');
    expect(code).toContain('.setURL("https://discord.js.org").setLabel("Docs").setStyle(ButtonStyle.Link)');
    expect(code).toContain('components: [row]');
    expect(() => new Function(`return async () => {\n${code}\n}`)).not.toThrow();
  });

  it('leaves out an author icon that has no author name', () => {
    const code = builderFile({ ...base, title: 'Hi', authorIcon: 'https://x.test/a.png' });
    expect(code).not.toContain('setAuthor');
  });
});

describe('toMessageJson', () => {
  it('produces valid JSON with removed and invalid parts left out', () => {
    const json = JSON.parse(
      toMessageJson({ ...base, title: 'Hi', image: 'not a url', timestamp: true, footerText: 'Foot' }, now)
    );
    expect(json).toEqual({
      embeds: [{ color: 0x5865f2, title: 'Hi', footer: { text: 'Foot' }, timestamp: '2026-01-01T00:00:00.000Z' }],
    });
  });

  it('adds an action row for valid buttons only', () => {
    const json = JSON.parse(
      toMessageJson({
        ...base,
        title: 'Hi',
        buttons: [
          { id: 'a', label: 'Ok', style: 'Danger', customId: 'ok', url: '' },
          { id: 'b', label: 'Bad link', style: 'Link', customId: '', url: '' },
        ],
      })
    );
    expect(json.components).toEqual([{ type: 1, components: [{ type: 2, style: 4, label: 'Ok', custom_id: 'ok' }] }]);
  });
});

describe('getWarnings', () => {
  it('flags an empty embed and duplicate custom IDs', () => {
    const warnings = getWarnings({
      ...base,
      buttons: [
        { id: 'a', label: 'A', style: 'Primary', customId: 'same', url: '' },
        { id: 'b', label: 'B', style: 'Primary', customId: 'same', url: '' },
      ],
    });
    expect(warnings.some((w) => w.includes('empty'))).toBe(true);
    expect(warnings.some((w) => w.includes('custom ID'))).toBe(true);
  });
});

describe('example images', () => {
  it('are left out of the code with one warning', () => {
    const embed: Embed = { ...base, title: 'Hi', image: 'example:banner', thumbnail: 'example:thumbnail' };
    expect(JSON.parse(toMessageJson(embed)).embeds[0]).toEqual({ color: 0x5865f2, title: 'Hi' });
    const warnings = getWarnings(embed).filter((w) => w.includes('Example images'));
    expect(warnings).toEqual([
      'Example images only show in this preview, so the image, thumbnail are left out. Paste your own image URL to include them.',
    ]);
  });
});

describe('tokenize', () => {
  it('keeps the text intact and marks strings, keys and methods', () => {
    const line = '    new ButtonBuilder().setCustomId("go").setLabel("https://x.test")';
    const tokens = tokenize(line);
    expect(tokens.map((t) => t.text).join('')).toBe(line);
    expect(tokens).toContainEqual({ text: 'setCustomId', kind: 'method' });
    expect(tokens).toContainEqual({ text: '"https://x.test"', kind: 'string' });
    expect(tokenize('  "title": "Hi",')).toContainEqual({ text: '"title"', kind: 'key' });
  });
});

describe('fieldSpans', () => {
  const field = (inline: boolean) => ({ id: '', name: 'n', value: 'v', inline });

  it('puts up to three inline fields on a row', () => {
    expect(fieldSpans([field(true), field(true), field(true), field(true), field(false)], false)).toEqual([2, 2, 2, 6, 6]);
  });

  it('puts two inline fields on a row next to a thumbnail', () => {
    expect(fieldSpans([field(true), field(true), field(true)], true)).toEqual([3, 3, 6]);
  });
});

describe('move', () => {
  it('moves an item to a new index', () => {
    expect(move(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });
});

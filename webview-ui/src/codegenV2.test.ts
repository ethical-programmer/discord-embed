import { describe, expect, it } from 'vitest';
import type { EmbedButton, V2Message } from '../../shared/protocol';
import { countComponents, getV2Warnings, toV2BuilderCode, toV2Json } from './codegenV2';
import { defaultMessage } from './defaults';

const button = (id: string, customId: string): EmbedButton => ({ id, label: 'Go', style: 'Primary', customId, url: '' });

const message: V2Message = {
  container: true,
  accentColor: '#5865F2',
  spoiler: false,
  blocks: [
    { id: 'a', type: 'text', content: '## Hi "there"\nline 2' },
    { id: 'b', type: 'separator', divider: true, spacing: 'large' },
    { id: 'c', type: 'section', texts: ['Side text'], accessory: 'thumbnail', thumbnail: 'https://x.test/t.png', button: button('x', 'unused') },
    { id: 'd', type: 'gallery', items: [{ id: 'g1', url: 'https://x.test/1.png' }, { id: 'g2', url: 'example:banner' }] },
    { id: 'e', type: 'buttons', buttons: [button('b1', 'go')] },
  ],
};

describe('toV2Json', () => {
  it('builds a container payload with the Components V2 flag', () => {
    const json = JSON.parse(toV2Json(message));
    expect(json.flags).toBe(32768);
    expect(json.components).toHaveLength(1);
    const container = json.components[0];
    expect(container.type).toBe(17);
    expect(container.accent_color).toBe(0x5865f2);
    expect(container.components.map((c: { type: number }) => c.type)).toEqual([10, 14, 9, 12, 1]);
    expect(container.components[1]).toEqual({ type: 14, divider: true, spacing: 2 });
    expect(container.components[2].accessory).toEqual({ type: 11, media: { url: 'https://x.test/t.png' } });
    // The example image is left out of the gallery.
    expect(container.components[3].items).toEqual([{ media: { url: 'https://x.test/1.png' } }]);
  });

  it('puts blocks at the top level without a container', () => {
    const json = JSON.parse(toV2Json({ ...message, container: false }));
    expect(json.components.map((c: { type: number }) => c.type)).toEqual([10, 14, 9, 12, 1]);
  });

  it('turns a section without a usable accessory into plain text', () => {
    const json = JSON.parse(
      toV2Json({
        ...message,
        container: false,
        blocks: [{ id: 's', type: 'section', texts: ['One', 'Two'], accessory: 'thumbnail', thumbnail: 'example:avatar', button: button('x', 'x') }],
      })
    );
    expect(json.components).toEqual([
      { type: 10, content: 'One' },
      { type: 10, content: 'Two' },
    ]);
  });
});

describe('toV2BuilderCode', () => {
  it('produces code that parses, with the imports it uses', () => {
    for (const container of [true, false]) {
      const { imports, body } = toV2BuilderCode({ ...message, container });
      expect(imports).toContain('MessageFlags');
      expect(imports).toContain('SectionBuilder');
      expect(body).toContain('MessageFlags.IsComponentsV2');
      expect(() => new Function(`return async () => {\n${imports}\n${body}\n}`)).not.toThrow();
    }
  });

  it('uses container methods for each block type', () => {
    const { body } = toV2BuilderCode(message);
    for (const method of ['addTextDisplayComponents', 'addSeparatorComponents', 'addSectionComponents', 'addMediaGalleryComponents', 'addActionRowComponents']) {
      expect(body).toContain(`.${method}(`);
    }
    expect(body).toContain('.setContent("## Hi \\"there\\"\\nline 2")');
  });
});

describe('countComponents and warnings', () => {
  it('counts nested components', () => {
    // container 1 + text 1 + separator 1 + section (1 + 1 text + 1 thumbnail) + gallery 1 + row (1 + 1 button)
    expect(countComponents(message)).toBe(9);
  });

  it('warns about example images and the 40 component limit', () => {
    const many: V2Message = { ...message, blocks: Array.from({ length: 41 }, (_, i) => ({ id: `t${i}`, type: 'text' as const, content: 'x' })) };
    expect(getV2Warnings(many).some((w) => w.includes('40'))).toBe(true);
    expect(getV2Warnings(message).some((w) => w.includes('Example images'))).toBe(true);
  });

  it('accepts the default message, apart from its example images', () => {
    const warnings = getV2Warnings(defaultMessage());
    expect(warnings.filter((w) => !w.includes('Example images') && !w.includes('plain text'))).toEqual([]);
  });
});

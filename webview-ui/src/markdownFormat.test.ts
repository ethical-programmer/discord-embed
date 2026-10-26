import { describe, expect, it } from 'vitest';
import { applyChange, makeLink, toggleLinePrefix, toggleWrap, type Change } from './markdownFormat';

/** Runs a change and shows the result with the new selection in [brackets]. */
function run(value: string, change: Change) {
  const next = applyChange(value, change);
  return `${next.slice(0, change.selectFrom)}[${next.slice(change.selectFrom, change.selectTo)}]${next.slice(change.selectTo)}`;
}

describe('toggleWrap', () => {
  it('wraps and unwraps a selection', () => {
    expect(run('say hi now', toggleWrap('say hi now', 4, 6, '**'))).toBe('say **[hi]** now');
    expect(run('say **hi** now', toggleWrap('say **hi** now', 6, 8, '**'))).toBe('say [hi] now');
    expect(run('say **hi** now', toggleWrap('say **hi** now', 4, 10, '**'))).toBe('say [hi] now');
  });

  it('keeps spaces outside the markers', () => {
    expect(run('say hi now', toggleWrap('say hi now', 4, 7, '__'))).toBe('say __[hi]__ now');
  });

  it('adds italic inside bold instead of breaking it', () => {
    expect(run('**hi**', toggleWrap('**hi**', 2, 4, '*'))).toBe('***[hi]***');
  });
});

describe('toggleLinePrefix', () => {
  it('adds and removes a prefix on every selected line', () => {
    expect(run('a\nb\nc', toggleLinePrefix('a\nb\nc', 0, 3, '> '))).toBe('[> a\n> b]\nc');
    expect(run('> a\n> b', toggleLinePrefix('> a\n> b', 2, 2, '> '))).toBe('[a]\n> b');
  });

  it('replaces another line style', () => {
    expect(run('## Title', toggleLinePrefix('## Title', 3, 8, '-# '))).toBe('[-# Title]');
  });
});

describe('makeLink', () => {
  it('links the selected text and selects the URL to type', () => {
    expect(run('see docs', makeLink('see docs', 4, 8))).toBe('see [docs]([https://])');
  });

  it('uses a selected URL as the target', () => {
    expect(run('https://x.test', makeLink('https://x.test', 0, 14))).toBe('[[link]](https://x.test)');
  });
});

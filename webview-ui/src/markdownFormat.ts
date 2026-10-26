// Markdown formatting for a text selection, as one text replacement plus the
// selection to restore afterwards. Pure functions, so they're easy to test.

export interface Change {
  /** Replace value.slice(from, to) with `insert`. */
  from: number;
  to: number;
  insert: string;
  /** Selection after the change. */
  selectFrom: number;
  selectTo: number;
}

export function applyChange(value: string, c: Change): string {
  return value.slice(0, c.from) + c.insert + value.slice(c.to);
}

/** Wraps the selection in `marker` (e.g. "**"), or unwraps it if it's already wrapped. */
export function toggleWrap(value: string, start: number, end: number, marker: string): Change {
  const m = marker.length;
  const selected = value.slice(start, end);

  // Markers just outside the selection. For single-character markers, "**x**" isn't italic.
  const single = m === 1 && value[start - 2] === marker && value[end + 1] === marker;
  if (value.slice(start - m, start) === marker && value.slice(end, end + m) === marker && !single) {
    return { from: start - m, to: end + m, insert: selected, selectFrom: start - m, selectTo: end - m };
  }
  // Markers included in the selection.
  if (selected.length >= 2 * m && selected.startsWith(marker) && selected.endsWith(marker)) {
    const inner = selected.slice(m, -m);
    return { from: start, to: end, insert: inner, selectFrom: start, selectTo: start + inner.length };
  }
  // Leave surrounding spaces outside the markers ("**word** " not "**word **"), which Discord needs.
  const from = start + (selected.length - selected.trimStart().length);
  const to = end - (selected.length - selected.trimEnd().length);
  const core = value.slice(from, to);
  return { from, to, insert: marker + core + marker, selectFrom: from + m, selectTo: from + m + core.length };
}

// Longest first, so "## " isn't mistaken for "# ".
const LINE_PREFIXES = ['### ', '## ', '# ', '-# ', '> ', '- '];

/** Adds `prefix` (e.g. "# ") to every selected line, replacing other line styles, or removes it if all lines have it. */
export function toggleLinePrefix(value: string, start: number, end: number, prefix: string): Change {
  const from = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = value.indexOf('\n', end);
  const to = lineEnd === -1 ? value.length : lineEnd;
  const lines = value.slice(from, to).split('\n');
  const remove = lines.every((line) => line.startsWith(prefix));
  const strip = (line: string) => {
    const existing = LINE_PREFIXES.find((p) => line.startsWith(p));
    return existing ? line.slice(existing.length) : line;
  };
  const insert = lines.map((line) => (remove ? line.slice(prefix.length) : prefix + strip(line))).join('\n');
  return { from, to, insert, selectFrom: from, selectTo: from + insert.length };
}

/** Turns the selection into [text](url) and selects the part to type next. */
export function makeLink(value: string, start: number, end: number): Change {
  const selected = value.slice(start, end).trim();
  if (/^https?:\/\/\S+$/.test(selected)) {
    // A URL was selected: keep it as the target and select the link text to type over.
    const insert = `[link](${selected})`;
    return { from: start, to: end, insert, selectFrom: start + 1, selectTo: start + 5 };
  }
  const text = selected || 'link text';
  const insert = `[${text}](https://)`;
  const urlStart = start + text.length + 3;
  return { from: start, to: end, insert, selectFrom: urlStart, selectTo: urlStart + 'https://'.length };
}

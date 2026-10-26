// A tiny highlighter for the code this extension generates (discord.js and JSON).
// Works line by line: generated strings never span lines.

export type TokenKind = 'string' | 'key' | 'comment' | 'keyword' | 'number' | 'method' | 'type';

export interface Token {
  text: string;
  kind?: TokenKind;
}

const TOKEN =
  /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')(\s*:)?|(\/\/.*$)|\b(const|new|await|require|true|false|null)\b|\b(0x[0-9A-Fa-f]+|\d+(?:\.\d+)?)\b|\.([A-Za-z_$][\w$]*)(?=\()|\b([A-Z][A-Za-z]+)\b/g;

export function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    const start = m.index ?? 0;
    if (start > last) tokens.push({ text: line.slice(last, start) });
    if (m[1]) {
      tokens.push({ text: m[1], kind: m[2] ? 'key' : 'string' });
      if (m[2]) tokens.push({ text: m[2] });
    } else if (m[3]) {
      tokens.push({ text: m[3], kind: 'comment' });
    } else if (m[4]) {
      tokens.push({ text: m[4], kind: 'keyword' });
    } else if (m[5]) {
      tokens.push({ text: m[5], kind: 'number' });
    } else if (m[6]) {
      tokens.push({ text: '.' }, { text: m[6], kind: 'method' });
    } else if (m[7]) {
      tokens.push({ text: m[7], kind: 'type' });
    }
    last = start + m[0].length;
  }
  if (last < line.length) tokens.push({ text: line.slice(last) });
  return tokens;
}

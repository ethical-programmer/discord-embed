import type { ReactNode } from 'react';

// A small renderer for the Discord markdown people use in embeds and Text Displays:
// headings, -# subtext, > quotes, - lists, ``` code blocks, and inline
// **bold**, *italic*, __underline__, ~~strike~~, ||spoiler||, `code`, [links](url).
// It builds React elements, never HTML strings.

const INLINE =
  /\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|\|\|(.+?)\|\||\*(.+?)\*|(?<![\w])_(.+?)_(?![\w])|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    const start = m.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const k = `${key}.${n++}`;
    if (m[1] !== undefined) out.push(<strong key={k}>{inline(m[1], k)}</strong>);
    else if (m[2] !== undefined) out.push(<u key={k}>{inline(m[2], k)}</u>);
    else if (m[3] !== undefined) out.push(<s key={k}>{inline(m[3], k)}</s>);
    else if (m[4] !== undefined) out.push(<span key={k} className="md-spoiler">{inline(m[4], k)}</span>);
    else if (m[5] !== undefined || m[6] !== undefined) out.push(<em key={k}>{inline(m[5] ?? m[6], k)}</em>);
    else if (m[7] !== undefined) out.push(<code key={k} className="md-code">{m[7]}</code>);
    else out.push(<span key={k} className="md-link" title={m[9]}>{inline(m[8], k)}</span>);
    last = start + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const joinLines = (lines: string[], key: string) =>
  lines.flatMap((line, i) => (i ? [<br key={`${key}.br${i}`} />, ...inline(line, `${key}.${i}`)] : inline(line, `${key}.${i}`)));

const HEADING = /^(#{1,3}) (.*)$/;
const LIST_ITEM = /^[-*] /;
const isSpecial = (line: string) =>
  line.startsWith('```') || HEADING.test(line) || line.startsWith('-# ') || line.startsWith('> ') || LIST_ITEM.test(line);

export function Markdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key = `b${i}`;
    const heading = HEADING.exec(line);

    if (line.startsWith('```')) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
      i++;
      blocks.push(<pre key={key} className="md-pre">{body.join('\n')}</pre>);
    } else if (heading) {
      const Tag = `h${heading[1].length}` as 'h1' | 'h2' | 'h3';
      blocks.push(<Tag key={key} className="md-h">{inline(heading[2], key)}</Tag>);
      i++;
    } else if (line.startsWith('-# ')) {
      blocks.push(<div key={key} className="md-sub">{inline(line.slice(3), key)}</div>);
      i++;
    } else if (line.startsWith('> ')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) quote.push(lines[i++].slice(2));
      blocks.push(<blockquote key={key} className="md-quote">{joinLines(quote, key)}</blockquote>);
    } else if (LIST_ITEM.test(line)) {
      const items: string[] = [];
      while (i < lines.length && LIST_ITEM.test(lines[i])) items.push(lines[i++].slice(2));
      blocks.push(
        <ul key={key} className="md-list">
          {items.map((item, j) => (
            <li key={j}>{inline(item, `${key}.${j}`)}</li>
          ))}
        </ul>
      );
    } else {
      const para: string[] = [];
      while (i < lines.length && !isSpecial(lines[i])) para.push(lines[i++]);
      blocks.push(<p key={key} className="md-p">{joinLines(para, key)}</p>);
    }
  }

  return <div className="md">{blocks}</div>;
}

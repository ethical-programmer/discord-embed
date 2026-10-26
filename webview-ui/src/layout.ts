import type { EmbedField } from '../../shared/protocol';

/**
 * Column span (out of 6) for each field, matching how Discord lays them out:
 * consecutive inline fields share a row, three at a time (two next to a thumbnail).
 */
export function fieldSpans(fields: EmbedField[], hasThumbnail: boolean): number[] {
  const perRow = hasThumbnail ? 2 : 3;
  const spans: number[] = [];
  let run = 0;
  const flush = () => {
    for (let i = 0; i < run; i += perRow) {
      const size = Math.min(perRow, run - i);
      for (let j = 0; j < size; j++) spans.push(6 / size);
    }
    run = 0;
  };
  for (const field of fields) {
    if (field.inline) {
      run++;
    } else {
      flush();
      spans.push(6);
    }
  }
  flush();
  return spans;
}

export function move<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

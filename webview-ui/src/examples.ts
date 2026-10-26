// The "avatar" example is the extension's own logo (a copy of icon.svg).
import avatar from './assets/logo.svg';
import banner from './assets/banner.svg';
import thumbnail from './assets/thumbnail.svg';
import { EXAMPLE_PREFIX, isExampleRef } from './limits';

// Example images ship inside the extension, so they only exist in this preview.
// The embed stores them as "example:<name>" and the code generator leaves them out.

export const EXAMPLE_IMAGES = { avatar, banner, thumbnail };

export type ExampleName = keyof typeof EXAMPLE_IMAGES;

export const exampleRef = (name: ExampleName) => `${EXAMPLE_PREFIX}${name}`;

export function resolveImage(url: string): string {
  if (!isExampleRef(url)) return url;
  return EXAMPLE_IMAGES[url.slice(EXAMPLE_PREFIX.length) as ExampleName] ?? '';
}

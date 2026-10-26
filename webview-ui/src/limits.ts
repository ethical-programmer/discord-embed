// Discord's documented embed and component limits.
export const LIMITS = {
  title: 256,
  description: 4096,
  fieldName: 256,
  fieldValue: 1024,
  footerText: 2048,
  authorName: 256,
  fields: 25,
  buttons: 5,
  buttonLabel: 80,
  customId: 100,
  total: 6000,
} as const;

function hasProtocol(value: string, protocols: string[]): boolean {
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export const isImageUrl = (value: string) => hasProtocol(value, ['http:', 'https:', 'attachment:']);

export const isLinkUrl = (value: string) => hasProtocol(value, ['http:', 'https:', 'discord:']);

/** Marks a bundled example image (see examples.ts), which Discord can't load. */
export const EXAMPLE_PREFIX = 'example:';

export const isExampleRef = (value: string | undefined) => value?.startsWith(EXAMPLE_PREFIX) ?? false;

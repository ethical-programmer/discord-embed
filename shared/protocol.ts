// Types shared by the extension (src/) and the webview (webview-ui/).

export type ButtonStyle = 'Primary' | 'Secondary' | 'Success' | 'Danger' | 'Link';

export interface EmbedField {
  id: string;
  name: string;
  value: string;
  inline: boolean;
}

export interface EmbedButton {
  id: string;
  label: string;
  style: ButtonStyle;
  /** Used by every style except Link. */
  customId: string;
  /** Used by the Link style only. */
  url: string;
}

/** An optional part is `undefined` when the user removed it from the embed. */
export interface Embed {
  color: string;
  authorIcon?: string;
  authorName?: string;
  title?: string;
  description?: string;
  fields: EmbedField[];
  image?: string;
  thumbnail?: string;
  footerIcon?: string;
  footerText?: string;
  timestamp: boolean;
  buttons: EmbedButton[];
}

// Components V2 (message flag IS_COMPONENTS_V2). Each block maps to one
// top-level component, or to one child of the container when it's on.

export interface V2Text {
  id: string;
  type: 'text';
  content: string;
}

export interface V2Section {
  id: string;
  type: 'section';
  /** 1–3 Text Displays. */
  texts: string[];
  accessory: 'thumbnail' | 'button';
  // Both are kept so switching the accessory doesn't lose either one.
  thumbnail: string;
  button: EmbedButton;
}

export interface V2GalleryItem {
  id: string;
  url: string;
}

export interface V2Gallery {
  id: string;
  type: 'gallery';
  items: V2GalleryItem[];
}

export interface V2Separator {
  id: string;
  type: 'separator';
  divider: boolean;
  spacing: 'small' | 'large';
}

export interface V2Buttons {
  id: string;
  type: 'buttons';
  buttons: EmbedButton[];
}

export type V2Block = V2Text | V2Section | V2Gallery | V2Separator | V2Buttons;

export interface V2Message {
  /** Wrap all blocks in one Container. */
  container: boolean;
  accentColor: string;
  spoiler: boolean;
  blocks: V2Block[];
}

export type EditorMode = 'embed' | 'components';

export interface Prefs {
  theme: 'auto' | 'light' | 'dark';
  zoom: number;
}

export interface SavedState {
  version: 2;
  mode: EditorMode;
  embed: Embed;
  message: V2Message;
  prefs: Prefs;
}

export type ToExtension =
  | { type: 'ready' }
  | { type: 'save'; state: SavedState }
  | { type: 'copy'; text: string };

export type ToWebview = { type: 'init'; state: SavedState | undefined };

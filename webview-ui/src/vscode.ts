import type { ToExtension } from '../../shared/protocol';

declare function acquireVsCodeApi(): { postMessage(message: unknown): void };

// acquireVsCodeApi() may only be called once per webview.
const api = acquireVsCodeApi();

export function post(message: ToExtension) {
  api.postMessage(message);
}

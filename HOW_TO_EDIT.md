# Discord Embed – how to edit

## Structure
- `src/extension.ts` – extension entry point: registers `extension.showEmbed`, the status bar item, and the webview panel. Saves the embed in `globalState` and copies code to the clipboard.
- `shared/protocol.ts` – types shared by both sides: the `Embed` shape and the messages between extension and webview.
- `webview-ui/src/` – the React UI
  - `App.tsx` – loads saved state, holds the embed, wires everything together
  - `components/EmbedPreview.tsx` – the embed preview (click to edit, trash to remove, drag to reorder)
  - `components/V2Preview.tsx` – the Components V2 preview (container and its blocks)
  - `components/parts.tsx` – pieces both previews share: the Discord window, editable parts, buttons, images
  - `components/EditModal.tsx` – edit forms for embed text, images, fields and buttons (plus the shared image picker and button fields)
  - `components/V2EditModal.tsx` – edit forms for V2 text, sections, galleries and separators
  - `components/CodeModal.tsx` – "Get Code" dialog
  - `components/Toolbar.tsx` – Add menu, color, zoom, theme, reset
  - `codegen.ts` – builds the embed's discord.js and JSON output (tested in `codegen.test.ts`)
  - `codegenV2.ts` – builds the Components V2 output and checks its limits (tested in `codegenV2.test.ts`)
  - `markdown.tsx` – renders Discord markdown in the preview
  - `limits.ts` – Discord's length limits
- `icon.svg` – source of `icon.png` (the marketplace logo). After editing it, export a 256×256 PNG over `icon.png` and copy it to `webview-ui/src/assets/logo.svg` (the logo inside the editor).
- `legacy/` – the old 1.0.1 source, kept for reference only (not shipped)

Built output goes to `dist/` (not committed).

## Run it locally
1. `npm install`
2. Press **F5** – it builds, then opens a new VS Code window with only this extension loaded (your other extensions are turned off there, so they can't crash it)
3. Click **Show Discord Embed** in the status bar

After changing code, stop and press F5 again (or run `npm run watch:extension` and `npm run watch:webview`, then reload the window with Ctrl+R).

## Checks
- `npm run typecheck`
- `npm test`

## Publish an update
Keep `publisher`, `name` and the `extension.showEmbed` command ID unchanged so existing users get the update.

1. Bump `"version"` in `package.json` and add an entry to `changelog.md`
2. `npm run package` → creates `discord-embed-x.x.x.vsix`; test it with "Extensions: Install from VSIX..."
3. `npx @vscode/vsce login EthicalProgrammer` (needs your Azure DevOps Personal Access Token)
4. `npx @vscode/vsce publish`

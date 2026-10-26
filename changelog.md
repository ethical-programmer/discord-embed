# Change Log

## [1.1.0]

Rebuilt with TypeScript and React.

### Fixed
- Generated code no longer breaks on quotes, apostrophes or line breaks.
- "JSON" output is now real JSON, and leaves out parts you removed.
- Button code now includes a custom ID and an action row, so discord.js accepts it.
- Editing a field after deleting, adding or reordering fields now edits the right one.
- Dark theme backgrounds and light theme text colors.
- Length limits now show a message instead of failing silently.

### Added
- Components V2: switch to "Container" to build messages from text, sections (with a thumbnail or button), media galleries, separators and button rows, optionally inside a container with an accent color.
- Discord markdown in the preview (headings, bold, subtext, quotes, lists, code), and a formatting toolbar that appears when you select text (also Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K).
- A completely redesigned editor: Discord-style channel preview, new toolbar, color presets, and polished dialogs in dark and light themes.
- Example avatar, thumbnail and banner images to try layouts with (preview only).
- Inline fields and Link buttons. Buttons get their custom ID from their label automatically.
- Code preview with warnings before copying.
- Your embed is saved between sessions.
- Theme follows VS Code automatically.

### Changed
- Opening the editor again focuses the existing tab instead of opening a new one.
- No more scripts loaded from the internet; everything ships with the extension.

## [1.0.1]

- Initial release.

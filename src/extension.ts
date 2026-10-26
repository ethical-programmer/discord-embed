import { randomBytes } from 'crypto';
import * as vscode from 'vscode';
import type { SavedState, ToExtension, ToWebview } from '../shared/protocol';

const STATE_KEY = 'discordEmbed.state';

let panel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    // Keep this command ID: existing users may have keybindings for it.
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.showEmbed', () => showPanel(context))
    );

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'extension.showEmbed';
    statusBarItem.text = '$(rocket) Show Discord Embed';
    statusBarItem.tooltip = 'Click to show Discord Embed';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}

export function deactivate() {}

function showPanel(context: vscode.ExtensionContext) {
    if (panel) {
        panel.reveal();
        return;
    }

    const webviewRoot = vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview');
    const current = vscode.window.createWebviewPanel(
        'discordEmbed',
        'Discord Embed',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [webviewRoot],
        }
    );
    panel = current;
    current.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');
    current.webview.html = getHtml(current.webview, webviewRoot);

    const messages = current.webview.onDidReceiveMessage(async (message: ToExtension) => {
        switch (message.type) {
            case 'ready': {
                const reply: ToWebview = {
                    type: 'init',
                    state: context.globalState.get<SavedState>(STATE_KEY),
                };
                await current.webview.postMessage(reply);
                break;
            }
            case 'save':
                await context.globalState.update(STATE_KEY, message.state);
                break;
            case 'copy':
                await vscode.env.clipboard.writeText(message.text);
                break;
        }
    });

    current.onDidDispose(() => {
        messages.dispose();
        panel = undefined;
    });
}

function getHtml(webview: vscode.Webview, webviewRoot: vscode.Uri): string {
    const script = webview.asWebviewUri(vscode.Uri.joinPath(webviewRoot, 'index.js'));
    const style = webview.asWebviewUri(vscode.Uri.joinPath(webviewRoot, 'index.css'));
    const nonce = randomBytes(16).toString('base64');
    const csp = [
        `default-src 'none'`,
        `img-src ${webview.cspSource} https: http: data:`,
        `style-src ${webview.cspSource} 'unsafe-inline'`,
        `font-src ${webview.cspSource}`,
        `script-src 'nonce-${nonce}'`,
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="${style}">
    <title>Discord Embed</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" nonce="${nonce}" src="${script}"></script>
</body>
</html>`;
}

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

function activate(context) {
    // Register the command
    let disposable = vscode.commands.registerCommand('extension.showEmbed', () => {
        const panel = vscode.window.createWebviewPanel(
            'discordEmbed', // Identifies the type of the webview. Used internally
            'Discord Embed', // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in
            {
                enableScripts: true,
                retainContextWhenHidden: true // Keep the webview content when hidden
            } // Webview options
        );

        // Read the HTML file
        const htmlFilePath = path.join(context.extensionPath, 'media', 'embed.html');
        let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

        // Get the current VS Code theme
        const isDarkTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark || 
                           vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast;
        
        // Inject theme information into the HTML
        htmlContent = htmlContent.replace('const vscodeTheme = null;', 
                                        `const vscodeTheme = { isDark: ${isDarkTheme} };`);

        // Set the webview's HTML content
        panel.webview.html = htmlContent;
        
        // Listen for theme changes
        vscode.window.onDidChangeActiveColorTheme(theme => {
            const updatedIsDarkTheme = theme.kind === vscode.ColorThemeKind.Dark || 
                                      theme.kind === vscode.ColorThemeKind.HighContrast;
            panel.webview.postMessage({ 
                command: 'themeChanged', 
                isDark: updatedIsDarkTheme 
            });
        }, null, context.subscriptions);
    });

    // Create a status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'extension.showEmbed'; 
    statusBarItem.text = '$(rocket) Show Discord Embed'; 
    statusBarItem.tooltip = 'Click to show Discord Embed'; 
    statusBarItem.show(); 

    // Add to a list of disposables which are disposed when the extension is deactivated
    context.subscriptions.push(disposable);
    context.subscriptions.push(statusBarItem);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};

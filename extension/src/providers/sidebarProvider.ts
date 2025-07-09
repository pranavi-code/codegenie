import * as vscode from 'vscode';
import { showLoginPage } from '../components/loginView';
import { getNonce } from '../utils';
import * as path from 'path';
import { getChatboxHtml, handleChatMessage } from './codeGenieView';

interface MenuOption {
    label: string;
    description: string;
    command: string;
    icon: string;
}

export class CodeGenieSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'codegenieView';

    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;

    private readonly menuOptions: MenuOption[] = [
        { label: "Login to CodeGenie", description: "Sign in to your CodeGenie account", command: "internal.login", icon: "account" },
        { label: "Process AI Comment", description: "Generate code from a comment", command: "codegenie.processAIComment", icon: "comment-discussion" },
        { label: "Convert Code", description: "Translate code to another language", command: "codegenie.convertCode", icon: "replace-all" },
        { label: "Remove Comments", description: "Removes all types of comments", command: "codegenie.removeAllComments", icon: "clear-all" },
        { label: "Analyze the Code", description: "Identify potential bugs and suggest fixes", command: "codegenie.analyzeCode", icon: "bug" },
        { label: "Optimize the Code", description: "Optimizes the code to the core", command: "codegenie.optimizeCode", icon: "star" },
        { label: "Project Analysis", description: "Get a summary, issues, fixes, and README walkthrough", command: "codegenie.analyzeProject", icon: "project" },
        { label: "Chat with CodeGenie", description: "Have a conversation with CodeGenie", command: "codegenie.chat", icon: "comment" }
    ];

    constructor(private readonly context: vscode.ExtensionContext) {
        this._extensionUri = context.extensionUri;
        console.log("CodeGenieSidebarProvider: Extension URI:", this._extensionUri.toString());
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(this._extensionUri.fsPath + '/media'),
            ]
        };
        console.log("CodeGenieSidebarProvider: Webview options set. Local resource roots:", webviewView.webview.options.localResourceRoots?.map(uri => uri.toString()));

        this._getHtmlForWebview(webviewView.webview).then(html => {
            webviewView.webview.html = html;
        });

        webviewView.webview.onDidReceiveMessage(async (data) => {
            console.log("CodeGenieSidebarProvider: Message received from webview:", data);
            if (data.command) {
                if (data.command === "internal.login") {
                    showLoginPage(this._extensionUri);
                } else if (['generateCode', 'insertCode', 'clearChat', 'getChatHistory'].includes(data.command)) {
                    await handleChatMessage(data, webviewView.webview);
                } else {
                    vscode.commands.executeCommand(data.command);
                }
            }
        });
    }

    private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {
        const nonce = getNonce();

        const toUri = (filePath: string[]) =>
            webview.asWebviewUri(
                vscode.Uri.file(
                    path.join(this._extensionUri.fsPath, ...filePath)
                )
            );

        const resetCssUri = toUri(['media', 'reset.css']);
        const vscodeCssUri = toUri(['media', 'vscode.css']);
        const customCssUri = toUri(['media', 'sidebar.css']);
        const scriptUri = toUri(['media', 'main.js']);

        let cardsHtml = '';
        this.menuOptions.forEach(option => {
            cardsHtml += `
                <div class="card" data-command="${option.command}" role="button" tabindex="0" aria-label="${option.label}: ${option.description}">
                    <div class="card-icon">
                        <span class="codicon codicon-${option.icon}"></span>
                    </div>
                    <div class="card-content">
                        <h3>${option.label}</h3>
                        <p>${option.description}</p>
                    </div>
                </div>
            `;
        });

        const csp = `
            default-src 'none';
            style-src ${webview.cspSource} 'unsafe-inline';
            font-src ${webview.cspSource} data:;
            img-src ${webview.cspSource} https: data:;
            script-src 'nonce-${nonce}' https://cdnjs.cloudflare.com;
        `.replace(/\s{2,}/g, ' ').trim();

        console.log("CodeGenieSidebarProvider: Using CSP:", csp);

        const chatboxHtml = await getChatboxHtml();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="${csp}">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${resetCssUri}" rel="stylesheet">
                <link href="${vscodeCssUri}" rel="stylesheet">
                <link href="${customCssUri}" rel="stylesheet">
                <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css" rel="stylesheet">
                <title>CodeGenie Actions</title>
            </head>
            <body>
                <div class="container" id="actions-container">
                    <h1>CodeGenie Actions</h1>
                    ${cardsHtml}
                </div>
                ${chatboxHtml}
                <script nonce="${nonce}" src="${scriptUri}"></script>
                <script nonce="${nonce}">
                    document.querySelectorAll('.card').forEach(card => {
                        card.addEventListener('click', () => {
                            const command = card.getAttribute('data-command');
                            if (command === 'codegenie.chat') {
                                vscode.postMessage({ command: 'showChat' });
                            } else {
                                vscode.postMessage({ command: command });
                            }
                        });
                        card.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                card.click();
                            }
                        });
                    });
                </script>
            </body>
            </html>`;
    }
}
import * as vscode from "vscode";
import { CodeGenieCompletionProvider } from "./providers/completionProvider";
import { registerProcessAICommentCommand } from "./components/aiComment";
import { registerConvertCodeCommand } from "./components/codeConversion";
import { createAndShowMenuStatusBarItem, registerShowMenuCommand } from "./components/menu";
import { registerCommentRemovalCommand } from "./components/commentRemoval";
import { registerAnalyzeCodeCommand } from "./components/analyzeCode";
import { registerOptimizationCommands } from "./components/optimizeCode";
import { CodeGenieSidebarProvider } from "./providers/sidebarProvider";
import { registerProjectAnalysisCommand } from "./components/projectAnalysis";

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Extension "codegenie" is now active!');

    createAndShowMenuStatusBarItem(context);

    registerShowMenuCommand(context);
    registerProcessAICommentCommand(context);
    registerConvertCodeCommand(context);
    registerCommentRemovalCommand(context);
    registerAnalyzeCodeCommand(context);
    registerOptimizationCommands(context);
    registerProjectAnalysisCommand(context);

    const completionProvider = vscode.languages.registerInlineCompletionItemProvider(
        { pattern: "**" },
        new CodeGenieCompletionProvider()
    );
    context.subscriptions.push(completionProvider);

    const acceptInlineCompletionCommand = vscode.commands.registerCommand('codegenie.acceptInlineCompletion', () => {
        vscode.commands.executeCommand('editor.action.inlineSuggest.accept');
    });
    context.subscriptions.push(acceptInlineCompletionCommand);
    const activeEditorChangeListener = vscode.window.onDidChangeActiveTextEditor(() => {
        CodeGenieCompletionProvider.setCurrentCompletion(null);
    }, null, context.subscriptions);
    context.subscriptions.push(activeEditorChangeListener);

    const sidebarProvider = new CodeGenieSidebarProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            CodeGenieSidebarProvider.viewType,
            sidebarProvider
        )
    );
    

    // Register the chat command to show the chat view
    // const chatCommand = vscode.commands.registerCommand('codegenie.chat', () => {
    //     vscode.commands.executeCommand('workbench.view.extension.codegenie-sidebar'); // Ensure the sidebar container is visible
    //     vscode.commands.executeCommand('codegenie.chatView.focus'); // Focus the chat view
    // });
    // context.subscriptions.push(chatCommand);
}

export function deactivate() {
    console.log('Extension "codegenie" is now deactivated!');
}
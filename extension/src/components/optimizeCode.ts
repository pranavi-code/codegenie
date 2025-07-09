// import * as vscode from 'vscode';
// import { getLoadingAnimation } from '../resources/getLoadingAnimation';
// import { optimizeCode } from '../services/apiService';
// import { getOptimizationResults } from '../pages/optimizeCodePage';
// import { getErrorContent } from '../resources/getErrorContent';

// export function registerOptimizationCommands(context: vscode.ExtensionContext) {
//     // Register command to optimize code
//     const optimizeCodeCommand = vscode.commands.registerCommand('codegenie.optimizeCode', async () => {
//         try {
//             await codeOptimization();
//         } catch (error) {
//             console.error('Error in optimize code command:', error);
//             vscode.window.showErrorMessage(`Failed to optimize code: ${error instanceof Error ? error.message : String(error)}`);
//         }
//     });

//     context.subscriptions.push(optimizeCodeCommand);
// }

// async function codeOptimization() {
//     const editor = vscode.window.activeTextEditor;
//     if (!editor) {
//         vscode.window.showInformationMessage('No active editor found');
//         return;
//     }

//     const document = editor.document;
//     const code = document.getText();
//     const languageId = document.languageId;

//     if (!code.trim()) {
//         vscode.window.showErrorMessage('No code found to optimize');
//         return;
//     }

//     // Show loading indicator in status bar
//     const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
//     statusBarItem.text = "$(sync~spin) Optimizing code...";
//     statusBarItem.show();

//     // Create and show the optimization view
//     const panel = vscode.window.createWebviewPanel(
//         'codeOptimizationView', 
//         'Code Optimization', 
//         vscode.ViewColumn.Beside,
//         {
//             enableScripts: true,
//             retainContextWhenHidden: true
//         }
//     );

//     // Set initial loading view
//     panel.webview.html = getLoadingAnimation("CodeGenie: Optimizing the code...");

//     try {
//         // Call API to optimize code
//         const response = await optimizeCode(code, languageId);
        
//         // Hide loading indicator
//         statusBarItem.hide();
//         statusBarItem.dispose();
        
//         if (response.status === 'success') {
//             // Update view with optimization results
//             panel.webview.html = getOptimizationResults(response.optimizations, languageId);
            
//             // Handle messages from webview (for apply optimization buttons)
//             panel.webview.onDidReceiveMessage(
//                 async (message) => {
//                     switch (message.command) {
//                         case 'applyOptimization':
//                             await applyOptimization(editor, message.line, message.code);
//                             break;
//                         case 'applyAllOptimizations':
//                             await applyAllOptimizations(editor, message.optimizations);
//                             break;
//                     }
//                 },
//                 undefined,
//                 // context.subscriptions
//             );
            
//         } else {
//             // Show error message in webview
//             panel.webview.html = getErrorContent("Code Optimization Error", response.error || 'Failed to optimize code');
//         }
        
//     } catch (error) {
//         console.error('Error during code optimization:', error);
        
//         // Hide loading indicator
//         statusBarItem.hide();
//         statusBarItem.dispose();
        
//         // Update webview with error content
//         panel.webview.html = getErrorContent(
//             "Code Optimization Error", 
//             `Error during code optimization: ${error instanceof Error ? error.message : String(error)}`
//         );
//     }
// }

// // Helper function to apply a single optimization
// async function applyOptimization(editor: vscode.TextEditor, line: number, optimizedCode: string) {
//     try {
//         const document = editor.document;
//         const lineToReplace = document.lineAt(line - 1); // VS Code uses 0-based indexing
        
//         await editor.edit(editBuilder => {
//             editBuilder.replace(lineToReplace.range, optimizedCode);
//         });
        
//         vscode.window.showInformationMessage(`Optimization applied to line ${line}`);
//     } catch (error) {
//         vscode.window.showErrorMessage(`Failed to apply optimization: ${error instanceof Error ? error.message : String(error)}`);
//     }
// }

// // Helper function to apply all optimizations
// async function applyAllOptimizations(editor: vscode.TextEditor, optimizations: any[]) {
//     try {
//         // Sort optimizations by line number in descending order to avoid line number conflicts
//         const sortedOptimizations = optimizations.sort((a, b) => b.line - a.line);
        
//         await editor.edit(editBuilder => {
//             for (const opt of sortedOptimizations) {
//                 const document = editor.document;
//                 const lineToReplace = document.lineAt(opt.line - 1); // VS Code uses 0-based indexing
//                 editBuilder.replace(lineToReplace.range, opt.optimized);
//             }
//         });
        
//         vscode.window.showInformationMessage(`Applied ${optimizations.length} optimizations`);
//     } catch (error) {
//         vscode.window.showErrorMessage(`Failed to apply optimizations: ${error instanceof Error ? error.message : String(error)}`);
//     }
// }





































// optimizeCode.ts
import * as vscode from 'vscode';
import { getLoadingAnimation } from '../resources/getLoadingAnimation';
// Ensure this path is correct for your apiService
import { optimizeCode as fetchOptimizationSuggestions, getOptimizedCode } from '../services/apiService'; 
import { getOptimizationResults } from '../pages/optimizeCodePage'; // Assuming this path
import { getErrorContent } from '../resources/getErrorContent';

export function registerOptimizationCommands(context: vscode.ExtensionContext) {
    const optimizeCodeCommand = vscode.commands.registerCommand('codegenie.optimizeCode', async () => {
        try {
            await showCodeOptimizationView(context); // Pass context
        } catch (error) {
            console.error('Error in optimize code command:', error);
            vscode.window.showErrorMessage(`Failed to optimize code: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    context.subscriptions.push(optimizeCodeCommand);
}

async function showCodeOptimizationView(context: vscode.ExtensionContext) { // Added context
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No active editor found.');
        return;
    }

    const document = editor.document;
    const code = document.getText();
    const languageId = document.languageId;

    if (!code.trim()) {
        vscode.window.showErrorMessage('No code found to optimize.');
        return;
    }

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = "$(sync~spin) Fetching optimization suggestions...";
    statusBarItem.show();

    const panel = vscode.window.createWebviewPanel(
        'codeOptimizationView', 
        'Code Optimization Suggestions', 
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [] // Add localResourceRoots if serving local files like CSS/JS from extension
        }
    );

    panel.webview.html = getLoadingAnimation("CodeGenie: Analyzing code for optimizations...");

    try {
        // Call API to get optimization SUGGESTIONS
        // The API response now is { status: "success", optimizations_result: { optimizations: [], summary: "" } }
        const response = await fetchOptimizationSuggestions(code, languageId); 
        
        statusBarItem.hide();
        statusBarItem.dispose();
        
        if (response.status === 'success' && response.optimizations_result) {
            // Pass the 'optimizations_result' object which contains 'optimizations' array and 'summary'
            panel.webview.html = getOptimizationResults(response.optimizations_result, languageId);
            
            panel.webview.onDidReceiveMessage(
                async (message) => {
                    switch (message.command) {
                        case 'getOptimizedCode':
                            try {
                                statusBarItem.text = "$(sync~spin) Fetching optimized code...";
                                statusBarItem.show();
                                const optimizedCodeResponse = await getOptimizedCode(
                                    message.original_snippet,
                                    message.description,
                                    message.languageId
                                );
                                statusBarItem.hide();
                                if (optimizedCodeResponse.status === 'success') {
                                    panel.webview.postMessage({
                                        command: 'displayOptimizedCode',
                                        optimizationId: message.optimizationId,
                                        optimizedCode: optimizedCodeResponse.optimized_code,
                                        line: message.line // Pass line back for context
                                    });
                                } else {
                                    vscode.window.showErrorMessage(`Failed to get optimized code: ${optimizedCodeResponse.error}`);
                                    panel.webview.postMessage({
                                        command: 'fetchingOptimizedCodeFailed',
                                        optimizationId: message.optimizationId,
                                        error: optimizedCodeResponse.error || 'Unknown error'
                                    });
                                }
                            } catch (e: any) {
                                statusBarItem.hide();
                                vscode.window.showErrorMessage(`API Error fetching optimized code: ${e.message}`);
                                panel.webview.postMessage({
                                    command: 'fetchingOptimizedCodeFailed',
                                    optimizationId: message.optimizationId,
                                    error: e.message
                                });
                            }
                            break;
                        case 'applySingleOptimization':
                            await applySingleOptimizationToEditor(editor, message.line, message.code);
                            // Notify webview that this specific optimization was applied
                            panel.webview.postMessage({ command: 'optimizationApplied', optimizationId: message.optimizationId });
                            break;
                        case 'applyAllOptimizations':
                            // message.suggestions will contain the initial list of suggestions
                            await applyAllSuggestedOptimizations(editor, message.suggestions, languageId, panel, statusBarItem);
                            break;
                    }
                },
                undefined,
                context.subscriptions // Important for disposable management
            );
            
        } else {
            panel.webview.html = getErrorContent("Code Optimization Error", response.error || 'Failed to get optimization suggestions.');
        }
        
    } catch (error) {
        console.error('Error during code optimization process:', error);
        statusBarItem.hide();
        statusBarItem.dispose();
        panel.webview.html = getErrorContent(
            "Code Optimization Error", 
            `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

// Renamed to avoid conflict with existing applyOptimization if it was different
async function applySingleOptimizationToEditor(editor: vscode.TextEditor, line: number, optimizedCode: string) {
    try {
        const document = editor.document;
        // VS Code uses 0-based indexing for lines
        const targetLine = line > 0 ? line - 1 : 0; 
        if (targetLine >= document.lineCount) {
            vscode.window.showErrorMessage(`Invalid line number: ${line}. Document has ${document.lineCount} lines.`);
            return;
        }
        const lineToReplace = document.lineAt(targetLine); 
        
        await editor.edit(editBuilder => {
            // This replaces the entire line. Adjust if optimizations are multi-line or partial.
            // If original was multi-line, this logic needs to be more sophisticated,
            // potentially using ranges if 'original' snippet was multi-line and we had start/end lines.
            // For now, assuming 'line' refers to the primary line to replace.
            editBuilder.replace(lineToReplace.range, optimizedCode);
        });
        
        vscode.window.showInformationMessage(`Optimization applied to line ${line}.`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to apply optimization: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function applyAllSuggestedOptimizations(
    editor: vscode.TextEditor, 
    suggestions: any[], 
    languageId: string,
    panel: vscode.WebviewPanel, // To send updates back
    statusBarItem: vscode.StatusBarItem // To show progress
) {
    if (!suggestions || suggestions.length === 0) {
        vscode.window.showInformationMessage("No suggestions to apply.");
        return;
    }

    vscode.window.showInformationMessage(`Starting to apply ${suggestions.length} optimization(s)...`);
    statusBarItem.text = `$(sync~spin) Applying optimizations (0/${suggestions.length})...`;
    statusBarItem.show();

    // Store fetched optimized codes to apply them in correct order (bottom-up)
    const optimizationsToApply: { line: number, code: string, id: string }[] = [];

    for (let i = 0; i < suggestions.length; i++) {
        const suggestion = suggestions[i];
        statusBarItem.text = `$(sync~spin) Fetching code for suggestion ${i + 1}/${suggestions.length}...`;
        try {
            // Check if webview already has the optimized code (if user clicked "Show" before "Apply All")
            // This would require JS in webview to store it, e.g., in a data attribute.
            // For simplicity here, we always fetch. A more advanced solution could avoid re-fetching.

            const optimizedCodeResponse = await getOptimizedCode(
                suggestion.original,
                suggestion.description,
                languageId
            );

            if (optimizedCodeResponse.status === 'success') {
                optimizationsToApply.push({ 
                    line: suggestion.line, 
                    code: optimizedCodeResponse.optimized_code ?? "",
                    id: suggestion.id 
                });
                // Optionally update the individual suggestion in the webview as it's fetched
                panel.webview.postMessage({
                    command: 'displayOptimizedCode',
                    optimizationId: suggestion.id,
                    optimizedCode: optimizedCodeResponse.optimized_code,
                    line: suggestion.line
                });
            } else {
                vscode.window.showWarningMessage(`Could not fetch optimized code for suggestion on line ${suggestion.line}: ${optimizedCodeResponse.error}`);
            }
        } catch (e: any) {
            vscode.window.showWarningMessage(`Error fetching optimized code for suggestion on line ${suggestion.line}: ${e.message}`);
        }
    }
    
    if (optimizationsToApply.length === 0) {
        vscode.window.showErrorMessage("No optimized code could be fetched to apply.");
        statusBarItem.hide();
        return;
    }

    // Sort optimizations by line number in descending order to avoid line number conflicts during replacement
    const sortedOptimizations = optimizationsToApply.sort((a, b) => b.line - a.line);
    
    statusBarItem.text = `$(sync~spin) Applying ${sortedOptimizations.length} fetched optimizations...`;
    try {
        await editor.edit(editBuilder => {
            for (const opt of sortedOptimizations) {
                const document = editor.document;
                const targetLine = opt.line > 0 ? opt.line - 1 : 0;
                 if (targetLine < document.lineCount) {
                    const lineToReplace = document.lineAt(targetLine);
                    editBuilder.replace(lineToReplace.range, opt.code);
                }
            }
        });
        vscode.window.showInformationMessage(`Successfully applied ${sortedOptimizations.length} optimization(s).`);
        panel.webview.postMessage({ command: 'allOptimizationsApplied' });

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to apply all optimizations: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        statusBarItem.hide();
    }
}

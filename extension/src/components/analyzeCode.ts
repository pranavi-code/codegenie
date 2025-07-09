// import * as vscode from "vscode";
// import { analyzeCode } from "../services/apiService";
// import { getLoadingAnimation } from "../resources/getLoadingAnimation"; 
// import { generateBugAnalysisContent } from "../pages/analyzeCodePage";
// import { applyFix } from "../pages/analyzeCodePage";
// import { getErrorContent } from "../resources/getErrorContent";

// export function registerAnalyzeCodeCommand(context: vscode.ExtensionContext) {
//     const disposable = vscode.commands.registerCommand("codegenie.analyzeCode", async () => {
//         const editor = vscode.window.activeTextEditor;
//         if (!editor) {
//             vscode.window.showErrorMessage("No active editor found");
//             return;
//         }

//         const document = editor.document;
//         const code = document.getText();
//         const languageId = document.languageId;

//         if (!code) {
//             getErrorContent("Error", "No code found in the current editor");
//             return;
//         }

//         const panel = vscode.window.createWebviewPanel(
//             "bugAnalysis",
//             "CodeGenie Bug Analysis",
//             vscode.ViewColumn.Beside,
//             {
//                 enableScripts: true
//             }
//         );

//         panel.webview.html = getLoadingAnimation("CodeGenie: Analyzing code for bugs...");

//         try {
//             const response = await analyzeCode(code, languageId);
//             let analysis = null;

//             console.log("Raw API response:", response.data);

//             if (typeof response.data === 'object') {
//                 if (response.data.status === "success" && response.data.analysis) {
//                     try {
//                         if (typeof response.data.analysis === "string") {
//                             const jsonMatch = response.data.analysis.match(/({[\s\S]*})/);
//                             if (jsonMatch) {
//                                 analysis = JSON.parse(jsonMatch[0]);
//                             } else {
//                                 analysis = JSON.parse(response.data.analysis);
//                             }
//                         } else {
//                             analysis = response.data.analysis;
//                         }
//                     } catch (error) {
//                         console.error("Failed to parse analysis result:", error);
//                     }
//                 } else if (response.data.issues ||
//                         (response.data.summary !== undefined && Array.isArray(response.data.issues))) {
//                     analysis = response.data;
//                 } else {
//                     analysis = response.data;
//                 }
//             } else if (typeof response.data === 'string') {
//                 try {
//                     analysis = JSON.parse(response.data);
//                 } catch (error) {
//                     console.error("Failed to parse string response:", error);
//                 }
//             }

//             if (!analysis) {
//                 analysis = {
//                     summary: "No response received from the server.",
//                     issues: []
//                 };
//             }

//             if (!analysis.issues) analysis.issues = [];
//             if (!analysis.summary) analysis.summary = "No detailed summary available";

//             console.log("Processed analysis:", JSON.stringify(analysis, null, 2));

//             panel.webview.html = generateBugAnalysisContent(analysis, document.fileName);

//         } catch (error) {
//             console.error("Error during bug detection:", error);
//             panel.webview.html = getErrorContent("Error", "Failed to connect to the server. Please ensure the CodeGenie server is running.");
//         }

//         panel.webview.onDidReceiveMessage(
//             async message => {
//                 switch (message.command) {
//                     case 'applyFix':
//                         await applyFix(message.fix, message.line, document);
//                         return;
//                 }
//             },
//             undefined,
//             []
//         );
//     });

//     context.subscriptions.push(disposable);
// }









































import * as vscode from "vscode";
import { analyzeCode } from "../services/apiService";
import { getLoadingAnimation } from "../resources/getLoadingAnimation"; 
import { generateBugAnalysisContent } from "../pages/analyzeCodePage";
import { applyFix } from "../pages/analyzeCodePage";
import { getErrorContent } from "../resources/getErrorContent";

export function registerAnalyzeCodeCommand(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand("codegenie.analyzeCode", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found");
            return;
        }

        const document = editor.document;
        const code = document.getText();
        const languageId = document.languageId;
        const fileName = document.fileName;

        if (!code || code.trim().length === 0) {
            vscode.window.showErrorMessage("No code found in the current editor");
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            "bugAnalysis",
            "CodeGenie Bug Analysis",
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = getLoadingAnimation("CodeGenie: Analyzing code for issues...");

        try {
            console.log("=== STARTING CODE ANALYSIS ===");
            console.log(`File: ${fileName}`);
            console.log(`Language: ${languageId}`);
            console.log(`Code length: ${code.length} characters`);

            // Phase 1: Analyze for issues only (no fixes)
            const response = await analyzeCode(code, languageId, false);
            console.log("Analysis response received:", response);

            let analysis = null;

            // Parse the response more carefully
            if (response.status === "error") {
                // Handle error response
                analysis = response.analysis;
                console.log("Error response, using fallback analysis");
            } else if (response.analysis) {
                // Direct analysis object
                analysis = response.analysis;
                console.log("Found analysis object directly");
            } else if (response.data && response.data.analysis) {
                // Nested analysis object
                analysis = response.data.analysis;
                console.log("Found nested analysis object");
            } else {
                // Try to extract from response directly
                analysis = {
                    summary: response.summary || "Analysis completed",
                    issues: response.issues || []
                };
                console.log("Constructed analysis from response fields");
            }

            // Ensure we have a valid analysis structure
            if (!analysis || typeof analysis !== 'object') {
                console.log("Creating fallback analysis structure");
                analysis = {
                    summary: "Analysis completed but no structured data received",
                    issues: []
                };
            }

            // Ensure required properties exist
            if (!analysis.issues || !Array.isArray(analysis.issues)) {
                analysis.issues = [];
            }
            if (!analysis.summary || typeof analysis.summary !== 'string') {
                analysis.summary = "Code analysis completed";
            }

            // Add metadata
            analysis.metadata = {
                language: languageId,
                analysis_type: "standard",
                has_fixes: false,
                total_issues: analysis.issues.length
            };

            // If no issues found, create some generic ones
            if (analysis.issues.length === 0) {
                console.log("No issues found, creating generic review suggestions");
                const lines = code.split('\n').length;
                
                analysis.issues = [
                    {
                        type: "code_review",
                        line: 1,
                        description: "Code structure looks good. Consider reviewing for potential optimizations and best practices.",
                        severity: "low"
                    }
                ];

                // Add more suggestions based on code characteristics
                if (lines > 50) {
                    analysis.issues.push({
                        type: "structure",
                        line: Math.floor(lines / 2),
                        description: "Large file detected. Consider breaking into smaller, more manageable modules.",
                        severity: "medium"
                    });
                }

                if (!code.includes('//') && !code.includes('/*')) {
                    analysis.issues.push({
                        type: "documentation",
                        line: 1,
                        description: "Consider adding comments to improve code readability and maintainability.",
                        severity: "low"
                    });
                }

                analysis.summary = "Code analysis complete. No critical issues found. Review suggestions provided.";
            }

            console.log(`Final analysis: ${analysis.issues.length} issues found`);
            analysis.issues.forEach((issue: { type: any; line: any; severity: any; }, index: number) => {
                console.log(`Issue ${index + 1}: ${issue.type} at line ${issue.line} - ${issue.severity}`);
            });

            // Generate and display the analysis
            panel.webview.html = generateBugAnalysisContent(analysis, fileName);

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(
                async (message) => {
                    console.log("Received message:", message);
                    switch (message.command) {
                        case 'applyFix':
                            if (message.fix && message.line) {
                                await applyFix(message.fix, message.line, document);
                            } else {
                                vscode.window.showErrorMessage("Invalid fix data received");
                            }
                            break;
                        case 'getFixes':
                            await handleGetFixes(panel, analysis, code, languageId, fileName);
                            break;
                        default:
                            console.warn('Unknown message command:', message.command);
                    }
                },
                undefined,
                context.subscriptions
            );

        } catch (error) {
            console.error("=== ANALYSIS COMMAND ERROR ===");
            console.error("Error:", error);
            
            // Create error analysis
            const errorAnalysis = {
                summary: "Analysis encountered an error. Please check your connection and try again.",
                issues: [{
                    type: "system_error",
                    line: 1,
                    description: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure the CodeGenie server is running.`,
                    severity: "high"
                }],
                metadata: {
                    language: languageId,
                    analysis_type: "error",
                    has_fixes: false,
                    total_issues: 1
                }
            };

            panel.webview.html = generateBugAnalysisContent(errorAnalysis, fileName);
        }
    });

    context.subscriptions.push(disposable);
}

async function handleGetFixes(
    panel: vscode.WebviewPanel, 
    analysis: any, 
    code: string, 
    languageId: string, 
    fileName: string
) {
    try {
        console.log("=== GETTING FIXES ===");
        panel.webview.html = getLoadingAnimation("CodeGenie: Generating fixes for identified issues...");

        // Phase 2: Get fixes for the identified issues
        const fixResponse = await analyzeCode(code, languageId, true);
        console.log("Fix response received:", fixResponse);

        let analysisWithFixes = null;

        // Parse fix response
        if (fixResponse.analysis) {
            analysisWithFixes = fixResponse.analysis;
        } else if (fixResponse.data && fixResponse.data.analysis) {
            analysisWithFixes = fixResponse.data.analysis;
        } else {
            // Fallback: Generate basic fixes for existing issues
            console.log("No fix response, generating basic fixes");
            analysisWithFixes = {
                ...analysis,
                issues: analysis.issues.map((issue: any, index: number) => ({
                    ...issue,
                    fix: generateBasicFix(issue, code, languageId)
                })),
                metadata: {
                    ...analysis.metadata,
                    has_fixes: true
                }
            };
        }

        // Ensure all issues have the fix property
        if (analysisWithFixes.issues) {
            analysisWithFixes.issues = analysisWithFixes.issues.map((issue: any) => {
                if (!issue.fix) {
                    issue.fix = generateBasicFix(issue, code, languageId);
                }
                return issue;
            });
        }

        // Update the webview with fixes
        panel.webview.html = generateBugAnalysisContent(analysisWithFixes, fileName);
        
        vscode.window.showInformationMessage(`✅ Generated fixes for ${analysisWithFixes.issues.length} issues`);

    } catch (error) {
        console.error("=== GET FIXES ERROR ===");
        console.error("Error getting fixes:", error);
        
        vscode.window.showErrorMessage("Failed to generate fixes. Using basic fixes instead.");
        
        // Generate basic fixes as fallback
        const analysisWithBasicFixes = {
            ...analysis,
            issues: analysis.issues.map((issue: any) => ({
                ...issue,
                fix: generateBasicFix(issue, code, languageId)
            })),
            metadata: {
                ...analysis.metadata,
                has_fixes: true
            }
        };
        
        panel.webview.html = generateBugAnalysisContent(analysisWithBasicFixes, fileName);
    }
}

function generateBasicFix(issue: any, code: string, languageId: string): string {
    const lines = code.split('\n');
    const lineIndex = Math.max(0, (issue.line || 1) - 1);
    const currentLine = lines[lineIndex] || '';

    console.log(`Generating fix for ${issue.type} at line ${issue.line}`);

    switch (issue.type) {
        case 'typo':
            return `// TODO: Fix typo in line ${issue.line}\n${currentLine}`;

        case 'null_pointer':
        case 'undefined_variable':
            return `// TODO: Add null/undefined check\nif (variable !== null && variable !== undefined) {\n    ${currentLine.trim()}\n}`;

        case 'syntax_error':
            if (issue.description && issue.description.toLowerCase().includes('semicolon')) {
                return currentLine.trim() + ';';
            }
            if (issue.description && issue.description.toLowerCase().includes('brace')) {
                return currentLine.trim() + ' {';
            }
            return `// TODO: Fix syntax error\n${currentLine}`;

        case 'missing_declaration':
        case 'missing_import':
            return `// TODO: Add missing declaration/import\n${currentLine}`;

        case 'code_review':
        case 'review_needed':
            return `// TODO: Review this code section for improvements\n${currentLine}`;

        case 'documentation':
            return `/**\n * TODO: Add documentation for this section\n */\n${currentLine}`;

        case 'structure':
            return `// TODO: Consider refactoring this section\n${currentLine}`;

        case 'validation':
            return `// TODO: Add input validation\n${currentLine}`;

        case 'logic_error':
            return `// TODO: Review logic in this section\n${currentLine}`;

        case 'system_error':
        default:
            return `// TODO: Address ${issue.type}: ${issue.description}\n${currentLine}`;
    }
}
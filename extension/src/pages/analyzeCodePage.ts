// import * as vscode from 'vscode';

// export function generateBugAnalysisContent(analysis: any, fileName: string) {
//     const baseName = fileName.split(/[\\/]/).pop() || "Unknown File";
//     const issues = Array.isArray(analysis.issues) ? analysis.issues : [];
//     const metadata = analysis.metadata || {};
//     const hasFixes = issues.some((issue: any) => issue.fix);

//     const issuesHtml = issues.length > 0
//         ? issues.map((issue: any, index: number) => {
//             const type = issue.type || "bug";
//             const line = issue.line || "unknown";
//             const description = issue.description || "No description provided";
//             const severity = issue.severity || "medium";
//             const fix = issue.fix;

//             // Map issue types to appropriate display names and colors
//             const typeDisplayMap: { [key: string]: string } = {
//                 'typo': 'TYPO',
//                 'null_pointer': 'NULL POINTER',
//                 'syntax_error': 'SYNTAX ERROR',
//                 'missing_declaration': 'MISSING DECLARATION',
//                 'review_needed': 'REVIEW NEEDED',
//                 'documentation': 'DOCUMENTATION',
//                 'system_error': 'SYSTEM ERROR',
//                 'code_review': 'CODE REVIEW',
//                 'validation': 'VALIDATION',
//                 'structure': 'STRUCTURE',
//                 'logic_error': 'LOGIC ERROR',
//                 'undefined_variable': 'UNDEFINED VARIABLE',
//                 'missing_import': 'MISSING IMPORT'
//             };

//             const displayType = typeDisplayMap[type] || type.toUpperCase();
            
//             const fixSection = fix ? `
//                 <div class="issue-fix">
//                     <h4>Suggested Fix:</h4>
//                     <pre class="code">${escapeHtml(fix)}</pre>
//                     <button class="apply-button" onclick="applyFix(${index})">Apply Fix</button>
//                 </div>
//             ` : '';

//             return `
//             <div class="issue ${severity}">
//                 <div class="issue-header">
//                     <span class="issue-type ${type.toLowerCase().replace('_', '-')}">${displayType}</span>
//                     <span class="issue-line">Line ${line}</span>
//                     <span class="issue-severity severity-${severity}">${severity.toUpperCase()}</span>
//                 </div>
//                 <div class="issue-description">${description}</div>
//                 ${fixSection}
//             </div>
//             `;
//         }).join('')
//         : '<div class="no-issues">No issues found in the analysis.</div>';

//     const fixesButton = !hasFixes ? `
//         <div class="fixes-section">
//             <button class="get-fixes-button" onclick="getFixes()">
//                 🔧 Generate Fixes for All Issues
//             </button>
//         </div>
//     ` : '';

//     return `
//         <!DOCTYPE html>
//         <html lang="en">
//         <head>
//             <meta charset="UTF-8">
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <title>CodeGenie Bug Analysis</title>
//             <style>
//                 body {
//                     font-family: var(--vscode-font-family);
//                     font-size: var(--vscode-font-size);
//                     color: var(--vscode-foreground);
//                     padding: 20px;
//                     line-height: 1.5;
//                     background-color: var(--vscode-editor-background);
//                 }
//                 h1 {
//                     font-size: 1.5em;
//                     margin-bottom: 15px;
//                     border-bottom: 2px solid var(--vscode-panel-border);
//                     padding-bottom: 10px;
//                     color: var(--vscode-activityBarBadge-background);
//                 }
//                 .summary {
//                     padding: 15px;
//                     margin-bottom: 20px;
//                     background-color: var(--vscode-input-background);
//                     border-radius: 8px;
//                     border-left: 4px solid var(--vscode-activityBarBadge-background);
//                 }
//                 .metadata {
//                     display: flex;
//                     gap: 15px;
//                     margin-bottom: 20px;
//                     flex-wrap: wrap;
//                 }
//                 .metadata-item {
//                     padding: 5px 10px;
//                     background-color: var(--vscode-button-secondaryBackground);
//                     border-radius: 15px;
//                     font-size: 0.9em;
//                     color: var(--vscode-button-secondaryForeground);
//                 }
//                 .fixes-section {
//                     text-align: center;
//                     margin: 20px 0;
//                 }
//                 .get-fixes-button {
//                     background-color: var(--vscode-activityBarBadge-background);
//                     color: var(--vscode-activityBarBadge-foreground);
//                     border: none;
//                     padding: 12px 24px;
//                     border-radius: 6px;
//                     cursor: pointer;
//                     font-size: 1em;
//                     font-weight: bold;
//                     transition: opacity 0.2s;
//                 }
//                 .get-fixes-button:hover {
//                     opacity: 0.8;
//                 }
//                 .issues-container {
//                     margin-top: 20px;
//                 }
//                 .issue {
//                     margin-bottom: 20px;
//                     padding: 20px;
//                     background-color: var(--vscode-input-background);
//                     border-radius: 8px;
//                     border-left: 4px solid var(--vscode-editorWarning-foreground);
//                     box-shadow: 0 2px 4px rgba(0,0,0,0.1);
//                 }
//                 .issue.critical {
//                     border-left-color: var(--vscode-editorError-foreground);
//                 }
//                 .issue.high {
//                     border-left-color: var(--vscode-editorWarning-foreground);
//                 }
//                 .issue.medium {
//                     border-left-color: var(--vscode-editorInfo-foreground);
//                 }
//                 .issue.low {
//                     border-left-color: var(--vscode-editorHint-foreground);
//                 }
//                 .issue-header {
//                     display: flex;
//                     justify-content: space-between;
//                     align-items: center;
//                     margin-bottom: 12px;
//                     flex-wrap: wrap;
//                     gap: 10px;
//                 }
//                 .issue-type {
//                     font-weight: bold;
//                     padding: 4px 12px;
//                     border-radius: 4px;
//                     color: white;
//                     font-size: 0.9em;
//                 }
//                 .typo { background-color: #d32f2f; }
//                 .null-pointer { background-color: #c2185b; }
//                 .syntax-error { background-color: #d32f2f; }
//                 .missing-declaration { background-color: #fb8c00; }
//                 .review-needed { background-color: #0288d1; }
//                 .documentation { background-color: #7b1fa2; }
//                 .system-error { background-color: #d32f2f; }
//                 .code-review { background-color: #0288d1; }
//                 .validation { background-color: #fb8c00; }
//                 .structure { background-color: #f57c00; }
//                 .logic-error { background-color: #c2185b; }
//                 .undefined-variable { background-color: #d32f2f; }
//                 .missing-import { background-color: #fb8c00; }
//                 .issue-line {
//                     font-weight: bold;
//                     color: var(--vscode-activityBarBadge-background);
//                 }
//                 .issue-severity {
//                     padding: 2px 8px;
//                     border-radius: 10px;
//                     font-size: 0.8em;
//                     font-weight: bold;
//                 }
//                 .severity-critical {
//                     background-color: var(--vscode-editorError-foreground);
//                     color: white;
//                 }
//                 .severity-high {
//                     background-color: var(--vscode-editorWarning-foreground);
//                     color: white;
//                 }
//                 .severity-medium {
//                     background-color: var(--vscode-editorInfo-foreground);
//                     color: white;
//                 }
//                 .severity-low {
//                     background-color: var(--vscode-editorHint-foreground);
//                     color: white;
//                 }
//                 .issue-description {
//                     margin-bottom: 15px;
//                     line-height: 1.6;
//                 }
//                 .issue-fix {
//                     background-color: var(--vscode-textCodeBlock-background);
//                     padding: 15px;
//                     border-radius: 6px;
//                     border: 1px solid var(--vscode-panel-border);
//                 }
//                 .issue-fix h4 {
//                     margin: 0 0 10px 0;
//                     color: var(--vscode-activityBarBadge-background);
//                 }
//                 .code {
//                     background-color: var(--vscode-editor-background);
//                     padding: 12px;
//                     border-radius: 4px;
//                     overflow-x: auto;
//                     font-family: var(--vscode-editor-font-family);
//                     font-size: var(--vscode-editor-font-size);
//                     white-space: pre-wrap;
//                     border: 1px solid var(--vscode-panel-border);
//                     margin: 8px 0;
//                 }
//                 .apply-button {
//                     background-color: var(--vscode-button-background);
//                     color: var(--vscode-button-foreground);
//                     border: none;
//                     padding: 8px 16px;
//                     border-radius: 4px;
//                     cursor: pointer;
//                     margin-top: 10px;
//                     font-weight: 600;
//                     transition: background-color 0.2s;
//                 }
//                 .apply-button:hover {
//                     background-color: var(--vscode-button-hoverBackground);
//                 }
//                 .no-issues {
//                     padding: 40px 20px;
//                     text-align: center;
//                     font-style: italic;
//                     color: var(--vscode-disabledForeground);
//                     background-color: var(--vscode-input-background);
//                     border-radius: 8px;
//                     font-size: 1.1em;
//                 }
//                 .issues-stats {
//                     display: flex;
//                     gap: 20px;
//                     margin-bottom: 20px;
//                     flex-wrap: wrap;
//                 }
//                 .stat-item {
//                     padding: 10px 15px;
//                     background-color: var(--vscode-button-secondaryBackground);
//                     border-radius: 6px;
//                     text-align: center;
//                 }
//                 .stat-number {
//                     font-size: 1.5em;
//                     font-weight: bold;
//                     color: var(--vscode-activityBarBadge-background);
//                 }
//                 .stat-label {
//                     font-size: 0.9em;
//                     color: var(--vscode-button-secondaryForeground);
//                 }
//             </style>
//         </head>
//         <body>
//             <h1>🔍 Bug Analysis for ${escapeHtml(baseName)}</h1>

//             <div class="summary">
//                 <h3>Analysis Summary</h3>
//                 <p>${escapeHtml(analysis.summary || 'No summary available')}</p>
//             </div>

//             ${metadata.total_issues !== undefined ? `
//             <div class="metadata">
//                 <div class="metadata-item">Language: ${escapeHtml(metadata.language || 'Unknown')}</div>
//                 <div class="metadata-item">Analysis Type: ${escapeHtml(metadata.analysis_type || 'Standard')}</div>
//                 ${metadata.has_fixes ? '<div class="metadata-item">✅ Fixes Available</div>' : '<div class="metadata-item">⚠️ Fixes Not Generated</div>'}
//             </div>
//             ` : ''}

//             <div class="issues-stats">
//                 <div class="stat-item">
//                     <div class="stat-number">${issues.length}</div>
//                     <div class="stat-label">Total Issues</div>
//                 </div>
//                 <div class="stat-item">
//                     <div class="stat-number">${issues.filter((i: any) => i.severity === 'critical').length}</div>
//                     <div class="stat-label">Critical</div>
//                 </div>
//                 <div class="stat-item">
//                     <div class="stat-number">${issues.filter((i: any) => i.severity === 'high').length}</div>
//                     <div class="stat-label">High</div>
//                 </div>
//                 <div class="stat-item">
//                     <div class="stat-number">${issues.filter((i: any) => i.severity === 'medium').length}</div>
//                     <div class="stat-label">Medium</div>
//                 </div>
//             </div>

//             ${fixesButton}

//             <div class="issues-container">
//                 ${issuesHtml}
//             </div>

//             <script>
//                 const vscode = acquireVsCodeApi();

//                 function applyFix(index) {
//                     const issues = ${JSON.stringify(issues)};
//                     const issue = issues[index];

//                     if (issue && issue.fix) {
//                         vscode.postMessage({
//                             command: 'applyFix',
//                             fix: issue.fix,
//                             line: issue.line
//                         });
//                     } else {
//                         console.error('No fix available for issue at index:', index);
//                     }
//                 }

//                 function getFixes() {
//                     vscode.postMessage({
//                         command: 'getFixes'
//                     });
//                 }
//             </script>
//         </body>
//         </html>
//     `;
// }

// function escapeHtml(unsafe: string): string {
//     if (typeof unsafe !== 'string') {
//         unsafe = String(unsafe);
//     }
//     return unsafe
//         .replace(/&/g, "&amp;")
//         .replace(/</g, "&lt;")
//         .replace(/>/g, "&gt;")
//         .replace(/"/g, "&quot;")
//         .replace(/'/g, "&#039;");
// }

// export async function applyFix(fix: string, lineNumber: number, document: vscode.TextDocument) {
//     const editor = vscode.window.activeTextEditor;
//     if (!editor || editor.document !== document) {
//         vscode.window.showErrorMessage("Cannot apply fix: Editor has changed");
//         return;
//     }

//     try {
//         const line = typeof lineNumber === 'string' ? parseInt(lineNumber, 10) : lineNumber;

//         if (isNaN(line) || line < 1 || line > document.lineCount) {
//             vscode.window.showErrorMessage(`Invalid line number: ${lineNumber}`);
//             return;
//         }

//         const docLine = document.lineAt(line - 1);

//         // Show confirmation dialog for applying fix
//         const confirmation = await vscode.window.showInformationMessage(
//             `Apply fix to line ${line}?`,
//             { modal: true },
//             "Apply Fix",
//             "Cancel"
//         );

//         if (confirmation === "Apply Fix") {
//             await editor.edit(editBuilder => {
//                 editBuilder.replace(docLine.range, fix);
//             });

//             // Position cursor at the fixed line
//             const newPosition = new vscode.Position(line - 1, 0);
//             editor.selection = new vscode.Selection(newPosition, newPosition);
//             editor.revealRange(new vscode.Range(newPosition, newPosition));

//             vscode.window.showInformationMessage("✅ Fix applied successfully");
//         }
//     } catch (error) {
//         console.error("Error applying fix:", error);
//         vscode.window.showErrorMessage(`❌ Failed to apply the fix: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
// }































import * as vscode from 'vscode';

export function generateBugAnalysisContent(analysis: any, fileName: string) {
    const baseName = fileName.split(/[\\/]/).pop() || "Unknown File";
    const issues = Array.isArray(analysis.issues) ? analysis.issues : [];
    const metadata = analysis.metadata || {};
    const hasFixes = issues.some((issue: any) => issue.fix);

    const issuesHtml = issues.length > 0
        ? issues.map((issue: any, index: number) => {
            const type = issue.type || "bug";
            const line = issue.line || "unknown";
            const description = issue.description || "No description provided";
            const severity = issue.severity || "medium";
            const fix = issue.fix;

            // Map issue types to appropriate display names and colors
            const typeDisplayMap: { [key: string]: string } = {
                'typo': 'TYPO',
                'null_pointer': 'NULL POINTER',
                'syntax_error': 'SYNTAX ERROR',
                'missing_declaration': 'MISSING DECLARATION',
                'review_needed': 'REVIEW NEEDED',
                'documentation': 'DOCUMENTATION',
                'system_error': 'SYSTEM ERROR',
                'code_review': 'CODE REVIEW',
                'validation': 'VALIDATION',
                'structure': 'STRUCTURE',
                'logic_error': 'LOGIC ERROR',
                'undefined_variable': 'UNDEFINED VARIABLE',
                'missing_import': 'MISSING IMPORT'
            };

            const displayType = typeDisplayMap[type] || type.toUpperCase();
            
            const fixSection = fix ? `
                <div class="issue-fix">
                    <h4>Suggested Fix:</h4>
                    <pre class="code">${escapeHtml(fix)}</pre>
                    <button class="copy-button" onclick="copyFix(${index})">Copy Fix</button>
                    <div class="copy-status" id="copy-status-${index}"></div>
                </div>
            ` : '';

            return `
            <div class="issue ${severity}">
                <div class="issue-header">
                    <span class="issue-type ${type.toLowerCase().replace('_', '-')}">${displayType}</span>
                    <span class="issue-line">Line ${line}</span>
                    <span class="issue-severity severity-${severity}">${severity.toUpperCase()}</span>
                </div>
                <div class="issue-description">${description}</div>
                ${fixSection}
            </div>
            `;
        }).join('')
        : '<div class="no-issues">No issues found in the analysis.</div>';

    const fixesButton = !hasFixes ? `
        <div class="fixes-section">
            <button class="get-fixes-button" onclick="getFixes()">
                🔧 Generate Fixes for All Issues
            </button>
        </div>
    ` : `
        <div class="fixes-section">
            <button class="copy-all-fixes-button" onclick="copyAllFixes()">
                📋 Copy All Fixes
            </button>
        </div>
    `;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CodeGenie Bug Analysis</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    padding: 20px;
                    line-height: 1.5;
                    background-color: var(--vscode-editor-background);
                }
                h1 {
                    font-size: 1.5em;
                    margin-bottom: 15px;
                    border-bottom: 2px solid var(--vscode-panel-border);
                    padding-bottom: 10px;
                    color: var(--vscode-activityBarBadge-background);
                }
                .summary {
                    padding: 15px;
                    margin-bottom: 20px;
                    background-color: var(--vscode-input-background);
                    border-radius: 8px;
                    border-left: 4px solid var(--vscode-activityBarBadge-background);
                }
                .metadata {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                .metadata-item {
                    padding: 5px 10px;
                    background-color: var(--vscode-button-secondaryBackground);
                    border-radius: 15px;
                    font-size: 0.9em;
                    color: var(--vscode-button-secondaryForeground);
                }
                .fixes-section {
                    text-align: center;
                    margin: 20px 0;
                }
                .get-fixes-button, .copy-all-fixes-button {
                    background-color: var(--vscode-activityBarBadge-background);
                    color: var(--vscode-activityBarBadge-foreground);
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1em;
                    font-weight: bold;
                    transition: opacity 0.2s;
                }
                .get-fixes-button:hover, .copy-all-fixes-button:hover {
                    opacity: 0.8;
                }
                .copy-all-fixes-button.copied {
                    background-color: var(--vscode-button-background);
                    opacity: 0.9;
                }
                .issues-container {
                    margin-top: 20px;
                }
                .issue {
                    margin-bottom: 20px;
                    padding: 20px;
                    background-color: var(--vscode-input-background);
                    border-radius: 8px;
                    border-left: 4px solid var(--vscode-editorWarning-foreground);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .issue.critical {
                    border-left-color: var(--vscode-editorError-foreground);
                }
                .issue.high {
                    border-left-color: var(--vscode-editorWarning-foreground);
                }
                .issue.medium {
                    border-left-color: var(--vscode-editorInfo-foreground);
                }
                .issue.low {
                    border-left-color: var(--vscode-editorHint-foreground);
                }
                .issue-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .issue-type {
                    font-weight: bold;
                    padding: 4px 12px;
                    border-radius: 4px;
                    color: white;
                    font-size: 0.9em;
                }
                .typo { background-color: #d32f2f; }
                .null-pointer { background-color: #c2185b; }
                .syntax-error { background-color: #d32f2f; }
                .missing-declaration { background-color: #fb8c00; }
                .review-needed { background-color: #0288d1; }
                .documentation { background-color: #7b1fa2; }
                .system-error { background-color: #d32f2f; }
                .code-review { background-color: #0288d1; }
                .validation { background-color: #fb8c00; }
                .structure { background-color: #f57c00; }
                .logic-error { background-color: #c2185b; }
                .undefined-variable { background-color: #d32f2f; }
                .missing-import { background-color: #fb8c00; }
                .issue-line {
                    font-weight: bold;
                    color: var(--vscode-activityBarBadge-background);
                }
                .issue-severity {
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.8em;
                    font-weight: bold;
                }
                .severity-critical {
                    background-color: var(--vscode-editorError-foreground);
                    color: white;
                }
                .severity-high {
                    background-color: var(--vscode-editorWarning-foreground);
                    color: white;
                }
                .severity-medium {
                    background-color: var(--vscode-editorInfo-foreground);
                    color: white;
                }
                .severity-low {
                    background-color: var(--vscode-editorHint-foreground);
                    color: white;
                }
                .issue-description {
                    margin-bottom: 15px;
                    line-height: 1.6;
                }
                .issue-fix {
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 15px;
                    border-radius: 6px;
                    border: 1px solid var(--vscode-panel-border);
                }
                .issue-fix h4 {
                    margin: 0 0 10px 0;
                    color: var(--vscode-activityBarBadge-background);
                }
                .code {
                    background-color: var(--vscode-editor-background);
                    padding: 12px;
                    border-radius: 4px;
                    overflow-x: auto;
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    white-space: pre-wrap;
                    border: 1px solid var(--vscode-panel-border);
                    margin: 8px 0;
                }
                .copy-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                    font-weight: 600;
                    transition: background-color 0.2s;
                }
                .copy-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .copy-button.copied {
                    background-color: var(--vscode-button-background);
                    opacity: 0.9;
                }
                .copy-status {
                    font-size: 0.9em;
                    color: var(--vscode-button-background);
                    margin-top: 8px;
                    font-style: italic;
                    min-height: 16px;
                }
                .no-issues {
                    padding: 40px 20px;
                    text-align: center;
                    font-style: italic;
                    color: var(--vscode-disabledForeground);
                    background-color: var(--vscode-input-background);
                    border-radius: 8px;
                    font-size: 1.1em;
                }
                .issues-stats {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                .stat-item {
                    padding: 10px 15px;
                    background-color: var(--vscode-button-secondaryBackground);
                    border-radius: 6px;
                    text-align: center;
                }
                .stat-number {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: var(--vscode-activityBarBadge-background);
                }
                .stat-label {
                    font-size: 0.9em;
                    color: var(--vscode-button-secondaryForeground);
                }
            </style>
        </head>
        <body>
            <h1>🔍 Bug Analysis for ${escapeHtml(baseName)}</h1>

            <div class="summary">
                <h3>Analysis Summary</h3>
                <p>${escapeHtml(analysis.summary || 'No summary available')}</p>
            </div>

            ${metadata.total_issues !== undefined ? `
            <div class="metadata">
                <div class="metadata-item">Language: ${escapeHtml(metadata.language || 'Unknown')}</div>
                <div class="metadata-item">Analysis Type: ${escapeHtml(metadata.analysis_type || 'Standard')}</div>
                ${metadata.has_fixes ? '<div class="metadata-item">✅ Fixes Available</div>' : '<div class="metadata-item">⚠️ Fixes Not Generated</div>'}
            </div>
            ` : ''}

            <div class="issues-stats">
                <div class="stat-item">
                    <div class="stat-number">${issues.length}</div>
                    <div class="stat-label">Total Issues</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${issues.filter((i: any) => i.severity === 'critical').length}</div>
                    <div class="stat-label">Critical</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${issues.filter((i: any) => i.severity === 'high').length}</div>
                    <div class="stat-label">High</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${issues.filter((i: any) => i.severity === 'medium').length}</div>
                    <div class="stat-label">Medium</div>
                </div>
            </div>

            ${fixesButton}

            <div class="issues-container">
                ${issuesHtml}
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                const issues = ${JSON.stringify(issues)};

                // Function to copy text to clipboard
                async function copyToClipboard(text) {
                    try {
                        if (navigator.clipboard && window.isSecureContext) {
                            await navigator.clipboard.writeText(text);
                            return true;
                        } else {
                            // Fallback for older browsers or non-secure contexts
                            const textArea = document.createElement('textarea');
                            textArea.value = text;
                            textArea.style.position = 'fixed';
                            textArea.style.left = '-999999px';
                            textArea.style.top = '-999999px';
                            document.body.appendChild(textArea);
                            textArea.focus();
                            textArea.select();
                            const successful = document.execCommand('copy');
                            document.body.removeChild(textArea);
                            return successful;
                        }
                    } catch (err) {
                        console.error('Failed to copy text: ', err);
                        return false;
                    }
                }

                async function copyFix(index) {
                    const issue = issues[index];
                    if (issue && issue.fix) {
                        const success = await copyToClipboard(issue.fix);
                        const button = document.querySelector(\`button[onclick="copyFix(\${index})"]\`);
                        const statusDiv = document.getElementById(\`copy-status-\${index}\`);
                        
                        if (success) {
                            if (button) {
                                button.textContent = 'Copied!';
                                button.classList.add('copied');
                            }
                            if (statusDiv) {
                                statusDiv.textContent = 'Fix copied to clipboard';
                            }
                            
                            setTimeout(() => {
                                if (button) {
                                    button.textContent = 'Copy Fix';
                                    button.classList.remove('copied');
                                }
                                if (statusDiv) {
                                    statusDiv.textContent = '';
                                }
                            }, 2000);
                        } else {
                            if (button) {
                                button.textContent = 'Copy Failed';
                            }
                            if (statusDiv) {
                                statusDiv.textContent = 'Failed to copy - please try again';
                            }
                            
                            setTimeout(() => {
                                if (button) {
                                    button.textContent = 'Copy Fix';
                                }
                                if (statusDiv) {
                                    statusDiv.textContent = '';
                                }
                            }, 2000);
                        }
                    } else {
                        console.error('No fix available for issue at index:', index);
                    }
                }

                async function copyAllFixes() {
                    const fixesWithInfo = issues
                        .filter(issue => issue.fix)
                        .map((issue, index) => {
                            const line = issue.line || 'unknown';
                            const type = issue.type || 'bug';
                            return \`// Fix for \${type.toUpperCase()} at Line \${line}\\n\${issue.fix\}\`;
                        });
                    
                    if (fixesWithInfo.length === 0) {
                        const button = document.querySelector('.copy-all-fixes-button');
                        if (button) {
                            button.textContent = 'No Fixes Available';
                            setTimeout(() => {
                                button.textContent = '📋 Copy All Fixes';
                            }, 2000);
                        }
                        return;
                    }
                    
                    const allFixesText = fixesWithInfo.join('\\n\\n// --- Next Fix ---\\n\\n');
                    const success = await copyToClipboard(allFixesText);
                    const button = document.querySelector('.copy-all-fixes-button');
                    
                    if (success) {
                        if (button) {
                            button.textContent = 'All Fixes Copied!';
                            button.classList.add('copied');
                        }
                        
                        setTimeout(() => {
                            if (button) {
                                button.textContent = '📋 Copy All Fixes';
                                button.classList.remove('copied');
                            }
                        }, 2000);
                    } else {
                        if (button) {
                            button.textContent = 'Copy Failed - Try Again';
                        }
                        
                        setTimeout(() => {
                            if (button) {
                                button.textContent = '📋 Copy All Fixes';
                            }
                        }, 2000);
                    }
                }

                function getFixes() {
                    vscode.postMessage({
                        command: 'getFixes'
                    });
                }
            </script>
        </body>
        </html>
    `;
}

function escapeHtml(unsafe: string): string {
    if (typeof unsafe !== 'string') {
        unsafe = String(unsafe);
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// This function is no longer needed since we're using copy functionality
// but keeping it for backward compatibility if still referenced elsewhere
export async function applyFix(fix: string, lineNumber: number, document: vscode.TextDocument) {
    console.log('applyFix function called but copy functionality is now used instead');
    // Function kept for compatibility but functionality moved to copy
}
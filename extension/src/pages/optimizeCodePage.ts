// export function getOptimizationResults(optimizationSuggestions: any, languageId: string): string {
//     // The API now returns an object like { optimizations: [...], summary: "..." }
//     // So, optimizationSuggestions from the API is optimization_data.optimizations_result
//     const suggestions = optimizationSuggestions.optimizations || [];
//     const summary = optimizationSuggestions.summary || "No summary provided.";

//     let optimizationsHtml = '';
//     if (suggestions && suggestions.length > 0) {
//         optimizationsHtml = suggestions.map((opt: any, index: number) => {
//             // Ensure opt.id is unique and available. If not, use index.
//             const optId = opt.id || `opt-${index}`;
//             return `
//                 <div class="optimization-item" id="opt-item-${optId}">
//                     <h3>Optimization Suggestion #${index + 1} - ${escapeHtml(opt.type || 'General')} (Line ${opt.line || 'N/A'})</h3>
//                     <p class="description"><strong>Description:</strong> ${escapeHtml(opt.description)}</p>
//                     <p class="impact"><strong>Impact:</strong> ${escapeHtml(opt.impact || 'N/A')}</p>
//                     <div class="code-section original-code-section">
//                         <h4>Original Code:</h4>
//                         <pre class="code-block language-${languageId}">${escapeHtml(opt.original)}</pre>
//                     </div>
//                     <div class="optimized-code-container" id="optimized-code-container-${optId}">
//                         </div>
//                     <button class="action-btn get-optimized-btn" 
//                             data-opt-id="${optId}" 
//                             data-original="${escapeHtml(opt.original)}"
//                             data-description="${escapeHtml(opt.description)}"
//                             data-line="${opt.line || 0}">
//                         Show Optimized Code
//                     </button>
//                     <div id="apply-btn-placeholder-${optId}"></div>
//                 </div>
//             `;
//         }).join('');
//     } else {
//         optimizationsHtml = `
//             <div class="no-optimizations">
//                 <p>${escapeHtml(summary)}</p>
//                 <p>No specific line-by-line optimization suggestions were found. You can review the code for general best practices or architectural improvements.</p>
//             </div>
//         `;
//     }

//     // Determine if any suggestions exist to enable/disable "Apply All"
//     const hasSuggestions = suggestions && suggestions.length > 0;

//     return `
//         <!DOCTYPE html>
//         <html lang="en">
//         <head>
//             <meta charset="UTF-8">
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <title>Code Optimization Suggestions</title>
//             <style>
//                 body {
//                     font-family: var(--vscode-font-family);
//                     color: var(--vscode-editor-foreground);
//                     background-color: var(--vscode-editor-background);
//                     padding: 20px;
//                     line-height: 1.6;
//                 }
//                 .summary {
//                     margin-bottom: 25px;
//                     padding: 15px;
//                     background-color: var(--vscode-sideBar-background, var(--vscode-editor-inactiveSelectionBackground));
//                     border-radius: 6px;
//                     border-left: 4px solid var(--vscode-button-background);
//                 }
//                 .summary h2 { margin-top: 0; }
//                 .optimization-item {
//                     margin-bottom: 25px;
//                     padding: 20px;
//                     border: 1px solid var(--vscode-panel-border, #333);
//                     border-radius: 8px;
//                     background-color: var(--vscode-sideBar-background, var(--vscode-editor-inactiveSelectionBackground, #2a2a2a));
//                 }
//                 .optimization-item h3 {
//                     margin-top: 0;
//                     color: var(--vscode-button-background);
//                 }
//                 .description, .impact {
//                     margin-bottom: 10px;
//                 }
//                 .code-section { margin-bottom: 10px; }
//                 .code-block {
//                     padding: 12px;
//                     background-color: var(--vscode-textCodeBlock-background, #1e1e1e);
//                     border: 1px solid var(--vscode-panel-border, #333);
//                     border-radius: 4px;
//                     overflow-x: auto;
//                     white-space: pre-wrap;
//                     font-family: var(--vscode-editor-font-family);
//                     font-size: var(--vscode-editor-font-size);
//                 }
//                 .action-btn, .apply-btn {
//                     margin-top: 10px;
//                     padding: 8px 15px;
//                     background-color: var(--vscode-button-background);
//                     color: var(--vscode-button-foreground);
//                     border: none;
//                     border-radius: 4px;
//                     cursor: pointer;
//                     transition: background-color 0.2s;
//                 }
//                 .action-btn:hover, .apply-btn:hover {
//                     background-color: var(--vscode-button-hoverBackground);
//                 }
//                 .action-btn:disabled, .apply-btn:disabled {
//                     background-color: var(--vscode-button-secondaryBackground);
//                     cursor: not-allowed;
//                     opacity: 0.7;
//                 }
//                 .optimized-code-container { margin-top: 15px; }
//                 .loading-text { font-style: italic; color: var(--vscode-descriptionForeground); }
//                 .error-text { color: var(--vscode-errorForeground, #ff6b6b); font-style: italic; }
//                 .no-optimizations {
//                     padding: 20px;
//                     background-color: var(--vscode-editor-inactiveSelectionBackground);
//                     border-radius: 5px;
//                     text-align: center;
//                     font-style: italic;
//                 }
//                 .apply-all-btn-container {
//                     margin-top: 30px;
//                     padding-top: 20px;
//                     border-top: 1px solid var(--vscode-panel-border);
//                     text-align: center;
//                 }
//             </style>
//             <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github-dark.min.css">
//             <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
//             <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/languages/${getHighlightLanguage(languageId)}.min.js"></script>
//         </head>
//         <body>
//             <h1>Code Optimization Suggestions</h1>
            
//             <div class="summary">
//                 <h2>Summary</h2>
//                 <p>${escapeHtml(summary)}</p>
//             </div>
            
//             <h2>Optimization Details (${suggestions?.length || 0})</h2>
            
//             ${optimizationsHtml}
            
//             ${hasSuggestions ? `
//             <div class="apply-all-btn-container">
//                 <button class="action-btn apply-all-btn">Apply All Fetched Optimizations</button>
//                 <p style="font-size:0.9em; color: var(--vscode-descriptionForeground); margin-top: 5px;">
//                     Note: 'Apply All' will attempt to apply optimizations for which 'Show Optimized Code' has been clicked. 
//                     For un-fetched optimizations, it will try to fetch them first.
//                 </p>
//             </div>` : ''}
            
//             <script>
//                 const vscode = acquireVsCodeApi();
//                 const allSuggestions = ${JSON.stringify(suggestions)}; // Store all suggestions

//                 // Enhanced HTML escaping function for JavaScript usage
//                 function escapeHtmlJs(unsafe) {
//                     if (unsafe === null || unsafe === undefined) {
//                         return '';
//                     }
//                     if (typeof unsafe !== 'string') {
//                         unsafe = String(unsafe);
//                     }
//                     return unsafe
//                         .replace(/&/g, "&amp;")
//                         .replace(/</g, "&lt;")
//                         .replace(/>/g, "&gt;")
//                         .replace(/"/g, "&quot;")
//                         .replace(/'/g, "&#039;")
//                         .replace(/\\\\/g, "&#92;")
//                         .replace(/\\n/g, "\\n")
//                         .replace(/\\r/g, "\\r")
//                         .replace(/\\t/g, "\\t");
//                 }

//                 // Initialize syntax highlighting
//                 function highlightVisibleCodeBlocks() {
//                     document.querySelectorAll('pre.code-block:not(.hljs-highlighted)').forEach((block) => {
//                         hljs.highlightElement(block);
//                         block.classList.add('hljs-highlighted');
//                     });
//                 }
//                 document.addEventListener('DOMContentLoaded', highlightVisibleCodeBlocks);

//                 document.querySelectorAll('.get-optimized-btn').forEach(button => {
//                     button.addEventListener('click', () => {
//                         const optId = button.getAttribute('data-opt-id');
//                         const original = button.getAttribute('data-original');
//                         const description = button.getAttribute('data-description');
//                         const line = button.getAttribute('data-line');

//                         button.textContent = 'Loading Optimized Code...';
//                         button.disabled = true;

//                         const container = document.getElementById(\`optimized-code-container-\${optId}\`);
//                         if (container) {
//                             container.innerHTML = '<p class="loading-text">Fetching optimized code...</p>';
//                         }
                        
//                         vscode.postMessage({
//                             command: 'getOptimizedCode',
//                             optimizationId: optId,
//                             original_snippet: original,
//                             description: description,
//                             languageId: "${languageId}",
//                             line: parseInt(line) // Pass line for context
//                         });
//                     });
//                 });

//                 // Handle 'Apply All' button
//                 const applyAllBtn = document.querySelector('.apply-all-btn');
//                 if (applyAllBtn) {
//                     applyAllBtn.addEventListener('click', () => {
//                         applyAllBtn.textContent = 'Processing All...';
//                         applyAllBtn.disabled = true;
                        
//                         // Send all initial suggestions to the extension to handle fetching and applying
//                         vscode.postMessage({
//                             command: 'applyAllOptimizations',
//                             suggestions: allSuggestions // Send the initial list of suggestions
//                         });
//                     });
//                 }

//                 // Function called from extension to display the fetched optimized code
//                 window.addEventListener('message', event => {
//                     const message = event.data;
//                     if (message.command === 'displayOptimizedCode') {
//                         const { optimizationId, optimizedCode, line } = message;
//                         const container = document.getElementById(\`optimized-code-container-\${optimizationId}\`);
//                         const getButton = document.querySelector(\`.get-optimized-btn[data-opt-id="\${optimizationId}"]\`);
//                         const applyButtonPlaceholder = document.getElementById(\`apply-btn-placeholder-\${optimizationId}\`);

//                         // Safely handle optimizedCode
//                         const safeOptimizedCode = optimizedCode || '';
//                         const escapedOptimizedCode = escapeHtmlJs(safeOptimizedCode);

//                         if (container) {
//                             container.innerHTML = \`
//                                 <h4>Optimized Code:</h4>
//                                 <pre class="code-block language-${languageId}" id="optimized-code-\${optimizationId}">\${escapedOptimizedCode}</pre>
//                             \`;
//                             // Store the fetched optimized code on the element for 'Apply All'
//                             container.dataset.optimizedCode = safeOptimizedCode; 
//                         }
//                         if (applyButtonPlaceholder) {
//                             applyButtonPlaceholder.innerHTML = \`
//                                 <button class="apply-btn" 
//                                         data-opt-id="\${optimizationId}"
//                                         data-line="\${line}" 
//                                         data-code="\${escapedOptimizedCode}">
//                                     Apply This Optimization
//                                 </button>
//                             \`;
//                             const applyBtn = applyButtonPlaceholder.querySelector('.apply-btn');
//                             if (applyBtn) {
//                                 applyBtn.addEventListener('click', function() {
//                                     vscode.postMessage({
//                                         command: 'applySingleOptimization',
//                                         line: parseInt(this.getAttribute('data-line')),
//                                         code: safeOptimizedCode, // Use unescaped code for actual application
//                                         optimizationId: this.getAttribute('data-opt-id')
//                                     });
//                                     this.textContent = 'Applied!';
//                                     this.disabled = true;
//                                     if(getButton) getButton.style.display = 'none'; // Hide "Show" button
//                                 });
//                             }
//                         }
//                         if (getButton) {
//                            getButton.style.display = 'none'; // Or just disable: getButton.disabled = true;
//                         }
//                         highlightVisibleCodeBlocks(); // Re-run highlight for new blocks
//                     } else if (message.command === 'optimizationApplied') {
//                         const button = document.querySelector(\`.apply-btn[data-opt-id="\${message.optimizationId}"]\`);
//                         if(button) {
//                             button.textContent = 'Applied!';
//                             button.disabled = true;
//                         }
//                          const getBtn = document.querySelector(\`.get-optimized-btn[data-opt-id="\${message.optimizationId}"]\`);
//                          if(getBtn) getBtn.style.display = 'none';
//                     } else if (message.command === 'allOptimizationsApplied') {
//                         if(applyAllBtn) {
//                             applyAllBtn.textContent = 'All Processed & Applied!';
//                             // applyAllBtn.disabled = true; // Keep it enabled if they want to try again? Or disable.
//                         }
//                         // Optionally update individual "Apply" buttons if not already done
//                         document.querySelectorAll('.apply-btn').forEach(btn => {
//                             if (!btn.disabled) { // Only update if not individually applied
//                                 btn.textContent = 'Applied via All';
//                                 btn.disabled = true;
//                             }
//                         });
//                          document.querySelectorAll('.get-optimized-btn').forEach(btn => {
//                             btn.style.display = 'none';
//                         });
//                     } else if (message.command === 'fetchingOptimizedCodeFailed') {
//                         const { optimizationId, error } = message;
//                         const container = document.getElementById(\`optimized-code-container-\${optimizationId}\`);
//                         const getButton = document.querySelector(\`.get-optimized-btn[data-opt-id="\${optimizationId}"]\`);
//                         if (container) {
//                             container.innerHTML = \`<p class="error-text">Error loading optimized code: \${escapeHtmlJs(error || 'Unknown error')}</p>\`;
//                         }
//                         if (getButton) {
//                             getButton.textContent = 'Retry Show Optimized Code';
//                             getButton.disabled = false; // Re-enable to allow retry
//                         }
//                     }
//                 });
//             </script>
//         </body>
//         </html>
//     `;
// }

// // Enhanced Helper function to escape HTML special characters with better error handling
// function escapeHtml(unsafe: string | null | undefined): string {
//     // Handle null, undefined, or non-string values
//     if (unsafe === null || unsafe === undefined) {
//         return '';
//     }
    
//     // Ensure it's a string
//     if (typeof unsafe !== 'string') {
//         unsafe = String(unsafe);
//     }
    
//     return unsafe
//         .replace(/&/g, "&amp;")
//         .replace(/</g, "&lt;")
//         .replace(/>/g, "&gt;")
//         .replace(/"/g, "&quot;")
//         .replace(/'/g, "&#039;")
//         .replace(/\\/g, "&#92;") // Escape backslashes
//         .replace(/\n/g, "&#10;") // Escape newlines for HTML attributes
//         .replace(/\r/g, "&#13;") // Escape carriage returns
//         .replace(/\t/g, "&#9;");  // Escape tabs
// }

// // Helper function to map VS Code language IDs to highlight.js language IDs (already provided)
// function getHighlightLanguage(languageId: string): string {
//     const languageMap: Record<string, string> = {
//         'typescript': 'typescript', 'javascript': 'javascript', 'python': 'python',
//         'java': 'java', 'csharp': 'csharp', 'cpp': 'cpp', 'c': 'c',
//         'ruby': 'ruby', 'go': 'go', 'rust': 'rust', 'php': 'php',
//         'html': 'html', 'css': 'css', 'json': 'json', 'markdown': 'markdown',
//         'sql': 'sql', 'swift': 'swift', 'kotlin': 'kotlin', 'dart': 'dart',
//         'shell': 'bash', 'powershell': 'powershell'
//     };
//     return languageMap[languageId] || 'plaintext';
// }






































export function getOptimizationResults(optimizationSuggestions: any, languageId: string): string {
    // The API now returns an object like { optimizations: [...], summary: "..." }
    // So, optimizationSuggestions from the API is optimization_data.optimizations_result
    const suggestions = optimizationSuggestions.optimizations || [];
    const summary = optimizationSuggestions.summary || "No summary provided.";

    let optimizationsHtml = '';
    if (suggestions && suggestions.length > 0) {
        optimizationsHtml = suggestions.map((opt: any, index: number) => {
            // Ensure opt.id is unique and available. If not, use index.
            const optId = opt.id || `opt-${index}`;
            return `
                <div class="optimization-item" id="opt-item-${optId}">
                    <h3>Optimization Suggestion #${index + 1} - ${escapeHtml(opt.type || 'General')} (Line ${opt.line || 'N/A'})</h3>
                    <p class="description"><strong>Description:</strong> ${escapeHtml(opt.description)}</p>
                    <p class="impact"><strong>Impact:</strong> ${escapeHtml(opt.impact || 'N/A')}</p>
                    <div class="code-section original-code-section">
                        <h4>Original Code:</h4>
                        <pre class="code-block language-${languageId}">${escapeHtml(opt.original)}</pre>
                    </div>
                    <div class="optimized-code-container" id="optimized-code-container-${optId}">
                        </div>
                    <button class="action-btn get-optimized-btn" 
                            data-opt-id="${optId}" 
                            data-original="${escapeHtml(opt.original)}"
                            data-description="${escapeHtml(opt.description)}"
                            data-line="${opt.line || 0}">
                        Show Optimized Code
                    </button>
                    <div id="copy-btn-placeholder-${optId}"></div>
                </div>
            `;
        }).join('');
    } else {
        optimizationsHtml = `
            <div class="no-optimizations">
                <p>${escapeHtml(summary)}</p>
                <p>No specific line-by-line optimization suggestions were found. You can review the code for general best practices or architectural improvements.</p>
            </div>
        `;
    }

    // Determine if any suggestions exist to enable/disable "Copy All"
    const hasSuggestions = suggestions && suggestions.length > 0;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Optimization Suggestions</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    line-height: 1.6;
                }
                .summary {
                    margin-bottom: 25px;
                    padding: 15px;
                    background-color: var(--vscode-sideBar-background, var(--vscode-editor-inactiveSelectionBackground));
                    border-radius: 6px;
                    border-left: 4px solid var(--vscode-button-background);
                }
                .summary h2 { margin-top: 0; }
                .optimization-item {
                    margin-bottom: 25px;
                    padding: 20px;
                    border: 1px solid var(--vscode-panel-border, #333);
                    border-radius: 8px;
                    background-color: var(--vscode-sideBar-background, var(--vscode-editor-inactiveSelectionBackground, #2a2a2a));
                }
                .optimization-item h3 {
                    margin-top: 0;
                    color: var(--vscode-button-background);
                }
                .description, .impact {
                    margin-bottom: 10px;
                }
                .code-section { margin-bottom: 10px; }
                .code-block {
                    padding: 12px;
                    background-color: var(--vscode-textCodeBlock-background, #1e1e1e);
                    border: 1px solid var(--vscode-panel-border, #333);
                    border-radius: 4px;
                    overflow-x: auto;
                    white-space: pre-wrap;
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                }
                .action-btn, .copy-btn {
                    margin-top: 10px;
                    padding: 8px 15px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .action-btn:hover, .copy-btn:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .action-btn:disabled, .copy-btn:disabled {
                    background-color: var(--vscode-button-secondaryBackground);
                    cursor: not-allowed;
                    opacity: 0.7;
                }
                .copy-btn.copied {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                .optimized-code-container { margin-top: 15px; }
                .loading-text { font-style: italic; color: var(--vscode-descriptionForeground); }
                .error-text { color: var(--vscode-errorForeground, #ff6b6b); font-style: italic; }
                .no-optimizations {
                    padding: 20px;
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    border-radius: 5px;
                    text-align: center;
                    font-style: italic;
                }
                .copy-all-btn-container {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid var(--vscode-panel-border);
                    text-align: center;
                }
                .copy-status {
                    font-size: 0.9em;
                    color: var(--vscode-button-background);
                    margin-top: 5px;
                    font-style: italic;
                }
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github-dark.min.css">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/languages/${getHighlightLanguage(languageId)}.min.js"></script>
        </head>
        <body>
            <h1>Code Optimization Suggestions</h1>
            
            <div class="summary">
                <h2>Summary</h2>
                <p>${escapeHtml(summary)}</p>
            </div>
            
            <h2>Optimization Details (${suggestions?.length || 0})</h2>
            
            ${optimizationsHtml}
            
            ${hasSuggestions ? `
            <div class="copy-all-btn-container">
                <button class="action-btn copy-all-btn">Copy All Optimized Code</button>
                <p style="font-size:0.9em; color: var(--vscode-descriptionForeground); margin-top: 5px;">
                    Note: 'Copy All' will copy all optimized code snippets that have been fetched. 
                    For un-fetched optimizations, it will try to fetch them first.
                </p>
            </div>` : ''}
            
            <script>
                const vscode = acquireVsCodeApi();
                const allSuggestions = ${JSON.stringify(suggestions)}; // Store all suggestions

                // Enhanced HTML escaping function for JavaScript usage
                function escapeHtmlJs(unsafe) {
                    if (unsafe === null || unsafe === undefined) {
                        return '';
                    }
                    if (typeof unsafe !== 'string') {
                        unsafe = String(unsafe);
                    }
                    return unsafe
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;")
                        .replace(/\\\\/g, "&#92;")
                        .replace(/\\n/g, "\\n")
                        .replace(/\\r/g, "\\r")
                        .replace(/\\t/g, "\\t");
                }

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

                // Initialize syntax highlighting
                function highlightVisibleCodeBlocks() {
                    document.querySelectorAll('pre.code-block:not(.hljs-highlighted)').forEach((block) => {
                        hljs.highlightElement(block);
                        block.classList.add('hljs-highlighted');
                    });
                }
                document.addEventListener('DOMContentLoaded', highlightVisibleCodeBlocks);

                document.querySelectorAll('.get-optimized-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const optId = button.getAttribute('data-opt-id');
                        const original = button.getAttribute('data-original');
                        const description = button.getAttribute('data-description');
                        const line = button.getAttribute('data-line');

                        button.textContent = 'Loading Optimized Code...';
                        button.disabled = true;

                        const container = document.getElementById(\`optimized-code-container-\${optId}\`);
                        if (container) {
                            container.innerHTML = '<p class="loading-text">Fetching optimized code...</p>';
                        }
                        
                        vscode.postMessage({
                            command: 'getOptimizedCode',
                            optimizationId: optId,
                            original_snippet: original,
                            description: description,
                            languageId: "${languageId}",
                            line: parseInt(line) // Pass line for context
                        });
                    });
                });

                // Handle 'Copy All' button
                const copyAllBtn = document.querySelector('.copy-all-btn');
                if (copyAllBtn) {
                    copyAllBtn.addEventListener('click', async () => {
                        copyAllBtn.textContent = 'Processing All...';
                        copyAllBtn.disabled = true;
                        
                        // Collect all optimized code that has been fetched
                        const fetchedOptimizations = [];
                        const containers = document.querySelectorAll('.optimized-code-container');
                        
                        containers.forEach(container => {
                            if (container.dataset.optimizedCode) {
                                fetchedOptimizations.push(container.dataset.optimizedCode);
                            }
                        });
                        
                        if (fetchedOptimizations.length > 0) {
                            const allOptimizedCode = fetchedOptimizations.join('\\n\\n// --- Next Optimization ---\\n\\n');
                            const success = await copyToClipboard(allOptimizedCode);
                            
                            if (success) {
                                copyAllBtn.textContent = 'All Code Copied!';
                                copyAllBtn.classList.add('copied');
                                setTimeout(() => {
                                    copyAllBtn.textContent = 'Copy All Optimized Code';
                                    copyAllBtn.classList.remove('copied');
                                    copyAllBtn.disabled = false;
                                }, 2000);
                            } else {
                                copyAllBtn.textContent = 'Copy Failed - Try Again';
                                copyAllBtn.disabled = false;
                            }
                        } else {
                            // If no optimizations are fetched yet, try to fetch all first
                            vscode.postMessage({
                                command: 'fetchAllOptimizations',
                                suggestions: allSuggestions
                            });
                        }
                    });
                }

                // Function called from extension to display the fetched optimized code
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'displayOptimizedCode') {
                        const { optimizationId, optimizedCode, line } = message;
                        const container = document.getElementById(\`optimized-code-container-\${optimizationId}\`);
                        const getButton = document.querySelector(\`.get-optimized-btn[data-opt-id="\${optimizationId}"]\`);
                        const copyButtonPlaceholder = document.getElementById(\`copy-btn-placeholder-\${optimizationId}\`);

                        // Safely handle optimizedCode
                        const safeOptimizedCode = optimizedCode || '';
                        const escapedOptimizedCode = escapeHtmlJs(safeOptimizedCode);

                        if (container) {
                            container.innerHTML = \`
                                <h4>Optimized Code:</h4>
                                <pre class="code-block language-${languageId}" id="optimized-code-\${optimizationId}">\${escapedOptimizedCode}</pre>
                            \`;
                            // Store the fetched optimized code on the element for 'Copy All'
                            container.dataset.optimizedCode = safeOptimizedCode; 
                        }
                        if (copyButtonPlaceholder) {
                            copyButtonPlaceholder.innerHTML = \`
                                <button class="copy-btn" 
                                        data-opt-id="\${optimizationId}"
                                        data-line="\${line}" 
                                        data-code="\${escapedOptimizedCode}">
                                    Copy Optimized Code
                                </button>
                                <div class="copy-status" id="copy-status-\${optimizationId}"></div>
                            \`;
                            const copyBtn = copyButtonPlaceholder.querySelector('.copy-btn');
                            const copyStatus = copyButtonPlaceholder.querySelector('.copy-status');
                            
                            if (copyBtn) {
                                copyBtn.addEventListener('click', async function() {
                                    const success = await copyToClipboard(safeOptimizedCode);
                                    
                                    if (success) {
                                        this.textContent = 'Copied!';
                                        this.classList.add('copied');
                                        if (copyStatus) {
                                            copyStatus.textContent = 'Code copied to clipboard';
                                        }
                                        
                                        setTimeout(() => {
                                            this.textContent = 'Copy Optimized Code';
                                            this.classList.remove('copied');
                                            if (copyStatus) {
                                                copyStatus.textContent = '';
                                            }
                                        }, 2000);
                                    } else {
                                        this.textContent = 'Copy Failed';
                                        if (copyStatus) {
                                            copyStatus.textContent = 'Failed to copy - please try again';
                                        }
                                        
                                        setTimeout(() => {
                                            this.textContent = 'Copy Optimized Code';
                                            if (copyStatus) {
                                                copyStatus.textContent = '';
                                            }
                                        }, 2000);
                                    }
                                });
                            }
                        }
                        if (getButton) {
                           getButton.style.display = 'none'; // Hide "Show" button after fetching
                        }
                        highlightVisibleCodeBlocks(); // Re-run highlight for new blocks
                    } else if (message.command === 'optimizationCopied') {
                        const button = document.querySelector(\`.copy-btn[data-opt-id="\${message.optimizationId}"]\`);
                        if(button) {
                            button.textContent = 'Copied!';
                            button.classList.add('copied');
                            setTimeout(() => {
                                button.textContent = 'Copy Optimized Code';
                                button.classList.remove('copied');
                            }, 2000);
                        }
                    } else if (message.command === 'allOptimizationsCopied') {
                        if(copyAllBtn) {
                            copyAllBtn.textContent = 'All Code Copied!';
                            copyAllBtn.classList.add('copied');
                            setTimeout(() => {
                                copyAllBtn.textContent = 'Copy All Optimized Code';
                                copyAllBtn.classList.remove('copied');
                                copyAllBtn.disabled = false;
                            }, 2000);
                        }
                    } else if (message.command === 'fetchingOptimizedCodeFailed') {
                        const { optimizationId, error } = message;
                        const container = document.getElementById(\`optimized-code-container-\${optimizationId}\`);
                        const getButton = document.querySelector(\`.get-optimized-btn[data-opt-id="\${optimizationId}"]\`);
                        if (container) {
                            container.innerHTML = \`<p class="error-text">Error loading optimized code: \${escapeHtmlJs(error || 'Unknown error')}</p>\`;
                        }
                        if (getButton) {
                            getButton.textContent = 'Retry Show Optimized Code';
                            getButton.disabled = false; // Re-enable to allow retry
                        }
                    }
                });
            </script>
        </body>
        </html>
    `;
}

// Enhanced Helper function to escape HTML special characters with better error handling
function escapeHtml(unsafe: string | null | undefined): string {
    // Handle null, undefined, or non-string values
    if (unsafe === null || unsafe === undefined) {
        return '';
    }
    
    // Ensure it's a string
    if (typeof unsafe !== 'string') {
        unsafe = String(unsafe);
    }
    
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\\/g, "&#92;") // Escape backslashes
        .replace(/\n/g, "&#10;") // Escape newlines for HTML attributes
        .replace(/\r/g, "&#13;") // Escape carriage returns
        .replace(/\t/g, "&#9;");  // Escape tabs
}

// Helper function to map VS Code language IDs to highlight.js language IDs (already provided)
function getHighlightLanguage(languageId: string): string {
    const languageMap: Record<string, string> = {
        'typescript': 'typescript', 'javascript': 'javascript', 'python': 'python',
        'java': 'java', 'csharp': 'csharp', 'cpp': 'cpp', 'c': 'c',
        'ruby': 'ruby', 'go': 'go', 'rust': 'rust', 'php': 'php',
        'html': 'html', 'css': 'css', 'json': 'json', 'markdown': 'markdown',
        'sql': 'sql', 'swift': 'swift', 'kotlin': 'kotlin', 'dart': 'dart',
        'shell': 'bash', 'powershell': 'powershell'
    };
    return languageMap[languageId] || 'plaintext';
}
import * as vscode from 'vscode';
import axios from 'axios';

const FLASK_API_URL = "http://localhost:5000/generate-code";

// Helper to generate a nonce for CSP
function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Chat history interface
interface ChatMessage {
    text: string;
    sender: string;
    timestamp: string;
    editHistory?: string[];
}

type GenerateCodeResponse = {
    generated_code: string;
    [key: string]: any; // Add this if your response may include other properties
};

export async function getChatboxHtml(): Promise<string> {
    const nonce = getNonce();

    // Languages for the dropdown
    const languages = [
        'plaintext', 'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'ruby', 'go', 'php', 'html', 'css'
    ];

    return `
    <div id="chat-container" style="display: none; flex-direction: column; height: 100vh;">
        <div id="chat-header" style="padding: 0.5rem; background-color: #333; display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0; color: white;">Chat with CodeGenie</h2>
            <div>
                <select id="language-select" style="padding: 0.3rem; border-radius: 4px; margin-right: 0.5rem;">
                    ${languages.map(lang => `<option value="${lang}">${lang.charAt(0).toUpperCase() + lang.slice(1)}</option>`).join('')}
                </select>
                <button id="share-btn" style="padding: 0.3rem 0.8rem; background-color: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer;">Share Chat</button>
                <button id="back-btn" style="padding: 0.3rem 0.8rem; background-color: #666; color: white; border: none; border-radius: 4px; margin-left: 0.5rem; cursor: pointer;">Back</button>
            </div>
        </div>
        <div id="chat" style="flex: 1; padding: 1rem; overflow-y: auto; position: relative;"></div>
        <div id="input-area" style="display: flex; padding: 0.75rem; border-top: 1px solid #333; background-color: #252526;">
            <textarea id="prompt" placeholder="Ask CodeGenie..." style="flex: 1; background-color: #1e1e1e; border: 1px solid #333; color: white; padding: 0.5rem 1rem; border-radius: 999px; outline: none; font-size: 14px; resize: none; min-height: 20px; max-height: 100px; overflow-y: auto;"></textarea>
            <button id="send-btn" style="margin-left: 0.5rem; padding: 0 16px; border: none; background-color: #007acc; color: white; font-size: 14px; border-radius: 999px; cursor: pointer;">➤</button>
        </div>
    </div>

    <script nonce="${nonce}" src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();

        const chat = document.getElementById("chat");
        const input = document.getElementById("prompt");
        const sendBtn = document.getElementById("send-btn");
        const chatContainer = document.getElementById("chat-container");
        const backBtn = document.getElementById("back-btn");
        const languageSelect = document.getElementById("language-select");
        const shareBtn = document.getElementById("share-btn");

        let messageEditHistory = new Map(); // Store edit history for each message

        function getCurrentTime() {
            const now = new Date();
            return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        function appendMessage(text, sender, isCode = false) {
            const messageDiv = document.createElement("div");
            messageDiv.className = "message " + sender;
            const timestamp = getCurrentTime();
            const messageId = Date.now().toString();

            if (isCode) {
                const pre = document.createElement("pre");
                const code = document.createElement("code");
                code.className = "language-" + languageSelect.value;
                code.textContent = text;
                pre.appendChild(code);
                messageDiv.appendChild(pre);

                const buttonContainer = document.createElement("div");
                buttonContainer.className = "btn-container";

                const insertBtn = document.createElement("button");
                insertBtn.id = "insert-btn-" + messageId;
                insertBtn.textContent = "Insert Code";
                insertBtn.onclick = () => {
                    vscode.postMessage({
                        command: "insertCode",
                        generatedCode: text
                    });
                };

                const copyBtn = document.createElement("button");
                copyBtn.id = "copy-btn-" + messageId;
                copyBtn.textContent = "Copy";
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(text);
                };

                const editBtn = document.createElement("button");
                editBtn.id = "edit-btn-" + messageId;
                editBtn.textContent = "Edit";
                editBtn.onclick = () => {
                    input.value = text;
                    input.focus();
                    let history = messageEditHistory.get(messageId) || [];
                    history.push(text);
                    messageEditHistory.set(messageId, history);
                };

                const historyBtn = document.createElement("button");
                historyBtn.id = "history-btn-" + messageId;
                historyBtn.textContent = "History";
                historyBtn.onclick = () => {
                    const history = messageEditHistory.get(messageId) || [];
                    if (history.length === 0) {
                        alert("No edit history available.");
                        return;
                    }
                    const historyText = history.map((ver, idx) => \`Version \${idx + 1}: \${ver}\`).join("\\n\\n");
                    alert(historyText);
                };

                const clearBtn = document.createElement("button");
                clearBtn.id = "clear-btn-" + messageId;
                clearBtn.textContent = "Clear Chat";
                clearBtn.onclick = () => {
                    vscode.postMessage({ command: "clearChat" });
                };

                buttonContainer.appendChild(insertBtn);
                buttonContainer.appendChild(copyBtn);
                buttonContainer.appendChild(editBtn);
                buttonContainer.appendChild(historyBtn);
                buttonContainer.appendChild(clearBtn);
                messageDiv.appendChild(buttonContainer);

                Prism.highlightElement(code); // Highlight code
            } else {
                const textDiv = document.createElement("div");
                textDiv.textContent = text;
                messageDiv.appendChild(textDiv);
            }

            const timeDiv = document.createElement("div");
            timeDiv.className = "timestamp";
            timeDiv.textContent = timestamp;
            messageDiv.appendChild(timeDiv);

            messageDiv.dataset.messageId = messageId;
            chat.appendChild(messageDiv);
            chat.scrollTop = chat.scrollHeight;
        }

        function showTypingIndicator() {
            const typingDiv = document.createElement("div");
            typingDiv.id = "typing-indicator";
            typingDiv.className = "message bot";
            typingDiv.innerHTML = '<span>Typing...</span><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
            chat.appendChild(typingDiv);
            chat.scrollTop = chat.scrollHeight;
        }

        function removeTypingIndicator() {
            const typingDiv = document.getElementById("typing-indicator");
            if (typingDiv) typingDiv.remove();
        }

        sendBtn.onclick = () => {
            const prompt = input.value.trim();
            if (!prompt) return;

            appendMessage(prompt, "user");
            input.value = "";

            vscode.postMessage({
                command: "generateCode",
                prompt: prompt,
                language: languageSelect.value
            });
        };

        input.addEventListener("keypress", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendBtn.click();
            }
        });

        shareBtn.onclick = () => {
            const history = JSON.parse(localStorage.getItem("codegenie_chat_history") || "[]");
            const chatText = history.map(msg => \`\${msg.sender === "user" ? "You" : "CodeGenie"} (\${msg.timestamp}): \${msg.text}\`).join("\\n\\n");
            const blob = new Blob([chatText], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "codegenie_chat_history.txt";
            a.click();
            URL.revokeObjectURL(url);
        };

        window.addEventListener("message", (event) => {
            const data = event.data;
            if (data.command === "showChat") {
                document.getElementById("actions-container").style.display = "none";
                chatContainer.style.display = "flex";
                vscode.postMessage({ command: "getChatHistory" });
            }
            if (data.command === "typing") {
                showTypingIndicator();
            }
            if (data.command === "showResult") {
                removeTypingIndicator();
                appendMessage(data.result, "bot", true);
            }
            if (data.command === "showInsertButton") {
                // Handled in appendMessage for code blocks
            }
            if (data.command === "clearChat") {
                chat.innerHTML = "";
                messageEditHistory.clear();
            }
            if (data.command === "loadChatHistory") {
                const history = data.history;
                chat.innerHTML = "";
                history.forEach(msg => {
                    appendMessage(msg.text, msg.sender, msg.sender === "bot");
                });
            }
        });

        backBtn.onclick = () => {
            chatContainer.style.display = "none";
            document.getElementById("actions-container").style.display = "block";
        };
    </script>

    <style>
        #chat-container { background-color: #1e1e1e; }
        .message { margin-bottom: 0.75rem; padding: 0.75rem; border-radius: 8px; max-width: 90%; position: relative; }
        .user { background-color: #007acc; color: white; margin-left: auto; }
        .bot { background-color: #333; color: #eee; margin-right: auto; }
        .timestamp { font-size: 10px; color: #888; margin-top: 0.3rem; text-align: right; }
        pre { background-color: #2d2d2d; padding: 1rem; border-radius: 8px; overflow-x: auto; }
        code { font-family: 'Courier New', monospace; font-size: 14px; }
        .btn-container { margin-top: 0.5rem; display: flex; justify-content: flex-start; gap: 0.5rem; }
        button[id^="insert-btn"], button[id^="copy-btn"], button[id^="edit-btn"], button[id^="history-btn"], button[id^="clear-btn"] {
            padding: 0.4rem 0.8rem; color: white; border-radius: 5px; cursor: pointer; font-size: 12px;
        }
        button[id^="insert-btn"] { background-color: #28a745; }
        button[id^="insert-btn"]:hover { background-color: #218838; }
        button[id^="copy-btn"] { background-color: #007acc; }
        button[id^="copy-btn"]:hover { background-color: #0a84d0; }
        button[id^="edit-btn"] { background-color: #f0ad4e; }
        button[id^="edit-btn"]:hover { background-color: #ec971f; }
        button[id^="history-btn"] { background-color: #6c757d; }
        button[id^="history-btn"]:hover { background-color: #5a6268; }
        button[id^="clear-btn"] { background-color: #ff5c5c; }
        button[id^="clear-btn"]:hover { background-color: #e04b4b; }
        #typing-indicator .dot { animation: blink 1s infinite; }
        #typing-indicator .dot:nth-child(2) { animation-delay: 0.2s; }
        #typing-indicator .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
    </style>
    `;
}

// Backend communication and history management
export async function handleChatMessage(message: any, webview: vscode.Webview) {
    if (message.command === 'generateCode') {
        const prompt = message.prompt;
        const language = message.language || 'plaintext';

        webview.postMessage({ command: 'typing' });

        try {
            const response = await axios.post(FLASK_API_URL, {
                comment: prompt,
                language: language
            });

            // Tell TypeScript the expected shape:
            const data = response.data as GenerateCodeResponse;
            const generatedCode = data.generated_code || "⚠ No code generated";

            // Save to chat history
            saveToChatHistory(prompt, generatedCode, 'user', 'bot');
            webview.postMessage({
                command: 'showResult',
                result: generatedCode
            });

            webview.postMessage({
                command: 'showInsertButton',
                result: generatedCode
            });

        } catch (err: any) {
            const errorMessage = `❌ Error: ${err.message}`;
            saveToChatHistory(prompt, errorMessage, 'user', 'bot');
            webview.postMessage({
                command: 'showResult',
                result: errorMessage
            });
        }
    }

    if (message.command === 'insertCode') {
        const generatedCode = message.generatedCode;
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.edit((editBuilder) => {
                editBuilder.insert(editor.selection.end, `\n${generatedCode}\n`);
            });
        }
    }

    if (message.command === 'clearChat') {
        localStorage.removeItem('codegenie_chat_history');
        webview.postMessage({ command: 'clearChat' });
    }

    if (message.command === 'getChatHistory') {
        const history = getChatHistory();
        webview.postMessage({ command: 'loadChatHistory', history });
    }
}

function getChatHistory(): ChatMessage[] {
    const history = localStorage.getItem('codegenie_chat_history');
    return history ? JSON.parse(history) : [];
}

function saveToChatHistory(userText: string, botText: string, userSender: string, botSender: string) {
    const history = getChatHistory();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    history.push({ text: userText, sender: userSender, timestamp });
    history.push({ text: botText, sender: botSender, timestamp });
    localStorage.setItem('codegenie_chat_history', JSON.stringify(history));
}
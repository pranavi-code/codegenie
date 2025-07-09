import axios from "axios";
import { CodeGenerationResponse } from "../templates/codeGenerationResponse";
import { CodeConversionResponse } from "../templates/codeConversionResponse";
import { CodeAnalysisResponse } from "../templates/codeAnalysisResponse";
import { CodeOptimizationResponse } from "../templates/codeOptimizationResponse";
import { ProjectAnalysisResponse } from "../templates/projectAnalysisResponse";

const API_BASE_URL = "http://localhost:5000";
// const API_BASE_URL = "https://9b4b-35-240-148-142.ngrok-free.app";

export async function generateCodeFromAI(
    prompt: string,
    file_content: string,
    cursor_line: number,
    language_id: string
): Promise<CodeGenerationResponse> {
    try {
        console.log({ prompt, file_content, cursor_line, language_id });
        // Specify the response type here:
        const response = await axios.post<CodeGenerationResponse>(`${API_BASE_URL}/generate`, {
            prompt,
            file_content,
            cursor_line,
            language_id
        });

        if (!response.data || !response.data.status || response.data.status !== "success") {
            throw new Error(response.data?.error || "Unknown error from backend (generate)");
        }

        return response.data;
    } catch (error: any) {
        console.error("Backend error (generateCodeFromAI):", error?.response?.data || error.message);
        let errorMessage = "❌ Error fetching AI response for code generation";
        if (error?.response?.data?.error) {
            errorMessage += `: ${error.response.data.error}`;
        } else if (error.message) {
            errorMessage += `: ${error.message}`;
        }
        throw error;
    }
}

export async function convertCodeLang(
    code: string,
    source_language: string,
    target_language: string
): Promise<CodeConversionResponse> {
    try {
        console.log({ code, source_language, target_language });
        const response = await axios.post<CodeConversionResponse>(`${API_BASE_URL}/convert`, {
            code,
            source_language,
            target_language
        });

        if (!response.data || !response.data.status || response.data.status !== "success") {
            throw new Error(response.data?.error || "Unknown error from backend (convert)");
        }

        if (!response.data.refined_code) {
            console.error("API response missing refined_code property:", response.data);
            throw new Error(`API response missing refined_code property for ${target_language}`);
        }

        return response.data;
    } catch (error: any) {
        console.error("Backend error (convertCodeLang):", error?.response?.data || error.message);
        let errorMessage = "❌ Error fetching AI response for code conversion";
        if (error?.response?.data?.error) {
            errorMessage += `: ${error.response.data.error}`;
        } else if (error.message) {
            errorMessage += `: ${error.message}`;
        }
        throw new Error(errorMessage);
    }
}

export async function analyzeCode(
    code: string,
    language_id: string,
    getFixes: boolean = false
): Promise<CodeAnalysisResponse> {
    try {
        console.log(`Analyzing code - Language: ${language_id}, Get Fixes: ${getFixes}`);
        console.log(`Code length: ${code.length} characters`);

        const response = await axios.post<CodeAnalysisResponse>(`${API_BASE_URL}/analyze`, {
            code,
            language_id,
            get_fixes: getFixes
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log("Raw response status:", response.status);
        console.log("Raw response data:", JSON.stringify(response.data, null, 2));

        if (!response.data) {
            console.error("No response data received");
            return {
                status: "error",
                error: "No response data received from server",
                analysis: "Failed to get response from server"
            };
        }

        if (response.data.status === "success" || response.data.status === "partial_success") {
            return response.data;
        }

        if ((response.data as any).analysis || (response.data as any).issues) {
            return {
                status: "partial_success",
                analysis: (response.data as any).analysis || "Analysis completed with unexpected format",
                ...(response.data as any)
            } as CodeAnalysisResponse;
        }

        console.warn("Unexpected response format:", response.data);
        return {
            status: "partial_success",
            analysis: "Analysis completed with unexpected format"
        } as CodeAnalysisResponse;

    } catch (error: any) {
        console.error("=== ANALYZE CODE ERROR ===");
        console.error("Error type:", error.constructor.name);
        console.error("Error message:", error.message);

        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", JSON.stringify(error.response.data, null, 2));
            console.error("Response headers:", error.response.headers);
        } else if (error.request) {
            console.error("No response received:", error.request);
        } else {
            console.error("Request setup error:", error.message);
        }

        return {
            status: "error",
            error: error.message || "Unknown error occurred during analysis",
            analysis: `Analysis failed: ${error.message || 'Connection error'}`
        };
    }
}

export async function getFixesForIssues(
    code: string,
    issues: any[],
    language_id: string
): Promise<{ status: string; issues_with_fixes?: any[]; error?: string }> {
    try {
        console.log(`Getting fixes for ${issues.length} issues`);
        const response = await axios.post<{ status: string; issues_with_fixes?: any[]; error?: string }>(
            `${API_BASE_URL}/get-fixes`,
            {
                code,
                issues,
                language_id
            }
        );

        if (!response.data || !response.data.status) {
            throw new Error(response.data?.error || "Unknown error from backend (get-fixes)");
        }

        return response.data;
    } catch (error: any) {
        console.error("Backend error (getFixesForIssues):", error?.response?.data || error.message);
        let errorMessage = "❌ Error fetching fixes for issues";
        if (error?.response?.data?.error) {
            errorMessage += `: ${error.response.data.error}`;
        } else if (error.message) {
            errorMessage += `: ${error.message}`;
        }

        return {
            status: "error",
            error: errorMessage
        };
    }
}

export async function optimizeCode(
    code: string,
    language_id: string
): Promise<CodeOptimizationResponse> {
    try {
        console.log({ code, language_id });
        const response = await axios.post<CodeOptimizationResponse>(`${API_BASE_URL}/optimize`, {
            code,
            language_id
        });

        if (!response.data || !response.data.status) {
            throw new Error(response.data?.error || "Unknown error from backend (optimize)");
        }

        return response.data;
    } catch (error: any) {
        console.error("Backend error (optimizeCode):", error?.response?.data || error.message);
        let errorMessage = "❌ Error fetching AI response for code optimization";
        if (error?.response?.data?.error) {
            errorMessage += `: ${error.response.data.error}`;
        } else if (error.message) {
            errorMessage += `: ${error.message}`;
        }
        throw new Error(errorMessage);
    }
}

export async function getOptimizedCode(
    originalSnippet: string,
    description: string,
    language_id: string
): Promise<{ status: string; optimized_code?: string; error?: string }> {
    try {
        console.log("Getting optimized code for snippet");
        const response = await axios.post<{ status: string; optimized_code?: string; error?: string }>(
            `${API_BASE_URL}/get-optimized-code`,
            {
                original_snippet: originalSnippet,
                description: description,
                language_id: language_id
            }
        );

        if (!response.data || !response.data.status) {
            throw new Error(response.data?.error || "Unknown error from backend (get-optimized-code)");
        }

        return response.data;
    } catch (error: any) {
        console.error("Backend error (getOptimizedCode):", error?.response?.data || error.message);
        let errorMessage = "❌ Error fetching optimized code";
        if (error?.response?.data?.error) {
            errorMessage += `: ${error.response.data.error}`;
        } else if (error.message) {
            errorMessage += `: ${error.message}`;
        }

        return {
            status: "error",
            error: errorMessage
        };
    }
}

export async function analyzeProject(): Promise<ProjectAnalysisResponse> {
    try {
        const response = await axios.post<ProjectAnalysisResponse>(`${API_BASE_URL}/analyze-project`, {});
        if (!response.data || response.data.status !== "success") {
            throw new Error(response.data?.error || "Unknown error from backend (analyze-project)");
        }
        return response.data;
    } catch (error: any) {
        console.error("Backend error (analyzeProject):", error?.response?.data || error.message);
        let errorMessage = "❌ Error fetching project analysis";
        if (error?.response?.data?.error) {
            errorMessage += `: ${error.response.data.error}`;
        } else if (error.message) {
            errorMessage += `: ${error.message}`;
        }
        throw new Error(errorMessage);
    }
}
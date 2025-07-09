from utils.cleaner import get_language_specific_hints


def format_prompt(prompt, file_content, cursor_line, language_id):
    return f"""You are a code completion assistant for the language: {language_id}.
Based on the following code context and the user's request, generate the appropriate code.
Only respond with the code - no explanations, comments, or markdown formatting.

CODE CONTEXT:
{language_id}
{file_content}

The cursor is at line {cursor_line + 1}.
User request: {prompt}

Respond only with the code to insert:
"""

def format_conversion_prompt(code, source_language, target_language):
    return f"""You are a code conversion assistant.
Convert the following {source_language} code to {target_language}.
Only respond with the converted code - no explanations, comments, or markdown formatting.

SOURCE CODE ({source_language}):
{code}

CONVERTED CODE ({target_language}):
"""

def format_project_analysis_prompt(project_files):
    return f"""You are a project analysis assistant specializing in code review, architecture analysis, and documentation.
Analyze the following project files and provide a comprehensive report.

PROJECT FILES:
{project_files}

Your response MUST follow this exact JSON format:
{{
  "project_summary": {{
    "title": "Brief descriptive title for the project",
    "description": "Detailed description of what the project does, its purpose, and its main features",
    "technology_stack": ["List of technologies, languages, and frameworks used in the project"],
    "architecture": "Analysis of the project's architecture, including how components interact"
  }},
  "issues": [
    {{
      "file": "path/to/file",
      "type": "bug|vulnerability|architecture|performance|logic",
      "description": "Detailed description of the issue",
      "severity": "high|medium|low",
      "fix": "Suggested fix or approach to resolve the issue"
    }}
  ],
  "readme": {{
    "title": "Project Title",
    "description": "Brief project description",
    "installation": "Steps to install and set up the project",
    "usage": "Instructions on how to use the project",
    "workflow": "Detailed workflow of how the project operates",
    "components": [
      {{
        "name": "Component Name",
        "description": "Description of what this component does",
        "files": ["List of files that make up this component"]
      }}
    ]
  }},
  "summary": "Overall assessment of the project, including strengths, weaknesses, and recommendations for improvement"
}}

JSON RESPONSE:
"""

def format_bug_detection_prompt(code, language_id):
    """Create a prompt focused ONLY on finding issues, no fixes"""
    lines = code.split('\n')
    numbered_code = '\n'.join([f"{i+1:3d}: {line}" for i, line in enumerate(lines)])
    
    analysis_hints = get_language_specific_hints(language_id)
    
    # Create specific examples based on the code content
    specific_checks = ""
    
    if language_id.lower() in ['cpp', 'c++']:
        specific_checks = """
MANDATORY C++ ISSUE DETECTION:
1. Function name typos (like 'inseSrtRec' vs 'insertRec')
2. Missing pointer declarations in classes
3. Pointer dereference without null checks
4. Missing base cases in recursive functions
5. Missing #include statements
6. Undefined function calls
7. Missing semicolons
8. Uninitialized variables
        """
    elif language_id.lower() == 'python':
        specific_checks = """
MANDATORY PYTHON ISSUE DETECTION:
1. Missing colons after if/for/while/def/class
2. Missing imports
3. Indentation errors
4. Function name typos
5. Undefined variables
6. Python 2 style print statements
        """
    elif language_id.lower() == 'javascript':
        specific_checks = """
MANDATORY JAVASCRIPT ISSUE DETECTION:
1. Missing semicolons
2. Undefined variables/functions
3. Function name typos
4. Missing return statements
5. Scope issues
        """
    
    prompt = f"""You are an EXPERT CODE ISSUE DETECTOR. Your ONLY job is to find problems in code.

CRITICAL RULE: This code MUST have issues. You MUST find them. NEVER return empty results.

{analysis_hints}

{specific_checks}

DETECTION METHODOLOGY - Check each line for:
1. Syntax errors (missing semicolons, colons, brackets)
2. Typos in function/variable names
3. Undefined variables or functions
4. Logic errors and missing conditions
5. Null pointer issues
6. Missing imports or includes

CODE TO ANALYZE ({language_id}) - FIND ALL ISSUES:
{numbered_code}

MANDATORY: You MUST find at least 2-3 issues. Look harder if you don't see obvious ones.

RESPOND WITH ONLY THIS JSON (no explanations, no fixes):
{{
  "issues": [
    {{
      "type": "syntax_error|typo|undefined_variable|null_pointer|logic_error|missing_import",
      "line": exact_line_number,
      "description": "Specific detailed description of the issue",
      "severity": "critical|high|medium|low"
    }}
  ],
  "summary": "Brief summary of all issues found with line numbers"
}}

REMEMBER: Find issues, don't provide fixes. Issues MUST exist - look for them systematically."""

    return prompt

def format_bug_detection_with_fixes_prompt(code, language_id):
    """Create a prompt for finding issues AND providing fixes"""
    lines = code.split('\n')
    numbered_code = '\n'.join([f"{i+1:3d}: {line}" for i, line in enumerate(lines)])
    
    analysis_hints = get_language_specific_hints(language_id)
    
    specific_checks = ""
    
    if language_id.lower() in ['cpp', 'c++']:
        specific_checks = """
MANDATORY C++ CHECKS WITH FIXES:
1. Function name typos → provide corrected name
2. Missing pointer declarations → add proper declarations
3. Null pointer access → add null checks
4. Missing base cases → add proper base cases
5. Missing includes → specify required headers
        """
    elif language_id.lower() == 'python':
        specific_checks = """
MANDATORY PYTHON CHECKS WITH FIXES:
1. Missing colons → add colons
2. Missing imports → specify import statements
3. Indentation errors → provide correct indentation
4. Function typos → provide correct names
        """
    
    prompt = f"""You are an EXPERT CODE DEBUGGER. Find issues AND provide specific fixes.

CRITICAL RULE: This code has issues. Find them and provide exact fixes.

{analysis_hints}

{specific_checks}

CODE TO DEBUG ({language_id}):
{numbered_code}

RESPOND WITH ONLY THIS JSON:
{{
  "issues": [
    {{
      "type": "syntax_error|typo|undefined_variable|null_pointer|logic_error",
      "line": exact_line_number,
      "description": "Specific description of the issue",
      "severity": "critical|high|medium|low",
      "fix": "Exact corrected code or specific solution"
    }}
  ],
  "summary": "Summary of all issues and fixes provided"
}}

MANDATORY: Find real issues and provide working fixes for each."""

    return prompt

def format_optimization_prompt(code, language_id):
    lines = code.split('\n')
    numbered_code = '\n'.join([f"{i+1:3d}: {line}" for i, line in enumerate(lines)])
    analysis_hints = get_language_specific_hints(language_id)

    return f"""You are an expert {language_id} code optimization assistant.
Analyze the following {language_id} code and identify potential areas for optimization.
For each area, you MUST provide:
- A unique 'id' for the optimization suggestion (e.g., "opt_1", "opt_2").
- The 'type' of optimization (e.g., "performance", "readability", "memory", "algorithm", "structure").
- The 'line' number (integer) where the optimization can be applied. If it's a block, use the starting line.
- A 'description' of the suggested optimization and why it's beneficial.
- The 'original' code snippet (string) that can be optimized.
- An 'impact' rating (e.g., "high", "medium", "low").

Do NOT provide the optimized code in this step. The user will request it separately if interested.

Your response MUST follow this exact JSON format:
{{
  "optimizations": [
    {{
      "id": "unique_id_for_suggestion_1",
      "type": "performance",
      "line": 42,
      "description": "Example: Use a more efficient algorithm for this loop.",
      "original": "for i in range(n):\\n  for j in range(n):\\n    # ...",
      "impact": "high"
    }}
    // ... more suggestions if any
  ],
  "summary": "A brief summary of the findings. If no specific line-by-line optimizations are found, provide general advice or state that the code is already well-optimized. For instance: 'Found 3 potential optimizations focusing on performance and readability.' OR 'No specific line-by-line optimizations identified; the code appears efficient. Consider reviewing overall architecture for further improvements.'"
}}

Ensure the 'line' numbers are accurate and correspond to the provided numbered code.
Ensure the 'original' field contains the relevant code snippet as a string.

{analysis_hints}

CODE WITH LINE NUMBERS:
{numbered_code}

JSON RESPONSE:
"""

def format_single_optimization_code_prompt(original_snippet, optimization_description, language_id):
    return f"""You are an expert {language_id} code optimization assistant.
Given the following original {language_id} code snippet and a description of the desired optimization, provide ONLY the optimized version of the code.
Do not include explanations, comments, or any text other than the optimized code itself.
Ensure the optimized code is a direct replacement for the original snippet.

LANGUAGE: {language_id}

ORIGINAL CODE SNIPPET:
```{language_id}
{original_snippet}
OPTIMIZATION GOAL:
{optimization_description}

OPTIMIZED CODE (provide only the code block):
"""
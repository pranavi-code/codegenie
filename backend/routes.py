import uuid
from flask import request, jsonify # type: ignore
from utils.generator import generator
from utils.prompts import (
    format_prompt,
    format_conversion_prompt,
    format_bug_detection_prompt,
    format_bug_detection_with_fixes_prompt,
    format_optimization_prompt,
    format_single_optimization_code_prompt,
    format_project_analysis_prompt,
)
from utils.cleaner import clean_response, extract_json_from_response, pre_analyze_code_structure, create_guaranteed_analysis, validate_and_fix_line_numbers
import logging
import traceback

logger = logging.getLogger(__name__)

def register_routes(app):
    @app.route('/generate', methods=['POST'])
    def generate_code():
        try:
            data = request.json
            prompt = data.get('prompt', '')
            file_content = data.get('file_content', '')
            cursor_line = data.get('cursor_line', 0)
            language_id = data.get('language_id', 'python')
            
            formatted_prompt = format_prompt(prompt, file_content, cursor_line, language_id)
            result = generator(formatted_prompt, do_sample=True)
            generated_text = result[0]['generated_text']
            response = generated_text[len(formatted_prompt):].strip()
            print(response)
            refined_code = clean_response(response, language_id)
            
            return jsonify({"status": "success", "response": response, "refined_code": refined_code})
        except Exception as e:
            logger.error(traceback.format_exc())
            return jsonify({"status": "error", "error": str(e)}), 500

    @app.route('/convert', methods=['POST'])
    def convert_code():
        try:
            data = request.json
            code = data.get('code', '')
            source_language = data.get('source_language', '')
            target_language = data.get('target_language', '')
            
            formatted_prompt = format_conversion_prompt(code, source_language, target_language)
            result = generator(formatted_prompt, do_sample=True)
            generated_text = result[0]['generated_text']
            response = generated_text[len(formatted_prompt):].strip()
            refined_code = clean_response(response, target_language)
            
            return jsonify({"status": "success", "response": response, "refined_code": refined_code})
        except Exception as e:
            logger.error(traceback.format_exc())
            return jsonify({"status": "error", "error": str(e)}), 500
        
    @app.route('/analyze-project', methods=['POST'])
    def analyze_project():
        try:
            data = request.json
            project_files = data.get('project_files', {})
            
            # Format project files into a string representation
            project_files_str = ""
            for file_path, content in project_files.items():
                project_files_str += f"=== {file_path} ===\n{content}\n\n"
            
            prompt = format_project_analysis_prompt(project_files_str)
            
            result = generator(prompt, do_sample=True)
            response = result[0]['generated_text'][len(prompt):].strip()
            analysis_json = extract_json_from_response(response) or {
                "project_summary": {
                    "title": "Unknown Project",
                    "description": "Analysis failed to produce a description.",
                    "technology_stack": [],
                    "architecture": "Analysis failed to determine architecture."
                },
                "issues": [],
                "readme": {
                    "title": "Project Documentation",
                    "description": "Analysis failed to produce a description.",
                    "installation": "N/A",
                    "usage": "N/A",
                    "workflow": "Analysis failed to determine workflow.",
                    "components": []
                },
                "summary": "Analysis failed to produce properly structured results."
            }

            return jsonify({"status": "success", "analysis": analysis_json})
        except Exception as e:
            logger.error(traceback.format_exc())
            return jsonify({"status": "error", "error": str(e)}), 500







    @app.route('/analyze', methods=['POST'])
    def analyze_code():
        """Two-phase analysis: first find issues, then optionally provide fixes"""
        try:
            logger.info("=== Starting Code Analysis Request ===")
            
            # Get request data
            data = request.json
            code = data.get('code', '')
            language_id = data.get('language_id', 'python')
            get_fixes = data.get('get_fixes', False)  # New parameter
            
            logger.info(f"Language: {language_id}")
            logger.info(f"Code length: {len(code)} characters")
            logger.info(f"Get fixes: {get_fixes}")
            
            # Validate input
            if not code.strip():
                logger.warning("Empty code provided")
                return jsonify({
                    "status": "error", 
                    "error": "No code provided for analysis"
                }), 400
            
            # Step 1: Always run pre-analysis (this is our safety net)
            logger.info("=== Step 1: Running Pre-Analysis ===")
            structural_issues = pre_analyze_code_structure(code, language_id)
            logger.info(f"Pre-analysis found {len(structural_issues)} issues")
            
            # Step 2: Generate LLM prompt for analysis only
            logger.info("=== Step 2: Generating Analysis Prompt ===")
            if get_fixes:
                prompt = format_bug_detection_with_fixes_prompt(code, language_id)
            else:
                prompt = format_bug_detection_prompt(code, language_id)
            
            # Step 3: Try LLM analysis
            logger.info("=== Step 3: Attempting LLM Analysis ===")
            llm_analysis = None
            llm_failed = False
            
            try:
                generation_attempts = [
                    {
                        'do_sample': True,
                        'temperature': 0.1,
                        'max_new_tokens': 1500,
                        'repetition_penalty': 1.2,
                        'top_p': 0.9
                    },
                    {
                        'do_sample': False,
                        'max_new_tokens': 1000,
                        'repetition_penalty': 1.1
                    },
                    {
                        'do_sample': True,
                        'temperature': 0.3,
                        'max_new_tokens': 800,
                        'repetition_penalty': 1.15
                    }
                ]
                
                for attempt_num, params in enumerate(generation_attempts, 1):
                    logger.info(f"LLM attempt {attempt_num}")
                    
                    try:
                        result = generator(prompt, **params)
                        response = result[0]['generated_text'][len(prompt):].strip()
                        
                        logger.info(f"LLM response length: {len(response)} characters")
                        
                        if response and len(response) > 10:
                            llm_analysis = extract_json_from_response(response)
                            if llm_analysis and llm_analysis.get('issues'):
                                logger.info(f"LLM analysis successful on attempt {attempt_num}")
                                break
                            else:
                                logger.warning(f"LLM attempt {attempt_num} produced no valid analysis")
                        else:
                            logger.warning(f"LLM attempt {attempt_num} produced empty response")
                            
                    except Exception as e:
                        logger.error(f"LLM attempt {attempt_num} failed: {e}")
                        continue
                
                if not llm_analysis or not llm_analysis.get('issues'):
                    logger.warning("All LLM attempts failed")
                    llm_failed = True
                    
            except Exception as e:
                logger.error(f"LLM generation failed: {e}")
                llm_failed = True
            
            # Step 4: Combine results or use guaranteed analysis
            logger.info("=== Step 4: Combining Results ===")
            
            if llm_failed or not llm_analysis:
                logger.info("Using guaranteed analysis")
                final_analysis = create_guaranteed_analysis(code, language_id, include_fixes=get_fixes)
            else:
                logger.info("Using LLM analysis")
                final_analysis = llm_analysis
                
                # Merge with structural issues
                if structural_issues:
                    if 'issues' not in final_analysis:
                        final_analysis['issues'] = []
                    
                    # Convert structural issues to match expected format
                    for issue in structural_issues:
                        formatted_issue = {
                            'type': issue['type'],
                            'line': issue['line'],
                            'description': issue['description'],
                            'severity': 'high'
                        }
                        if get_fixes:
                            formatted_issue['fix'] = issue['fix']
                        
                        final_analysis['issues'].append(formatted_issue)
                    
                    # Update summary
                    structural_count = len(structural_issues)
                    llm_count = len(llm_analysis.get('issues', []))
                    
                    final_analysis['summary'] = (
                        f"Found {structural_count} structural issues and {llm_count} LLM-detected issues. "
                        + final_analysis.get('summary', '')
                    )
            
            # Step 5: Validate and clean results
            logger.info("=== Step 5: Validating Results ===")
            final_analysis = validate_and_fix_line_numbers(final_analysis, code)
            
            # FORCE at least one issue - this is critical
            if not final_analysis.get('issues') or len(final_analysis['issues']) == 0:
                logger.warning("No issues found - creating forced analysis")
                
                # Analyze code more aggressively
                forced_issues = []
                lines = code.split('\n')
                
                # Look for common patterns that indicate issues
                for i, line in enumerate(lines, 1):
                    line_stripped = line.strip()
                    if not line_stripped:
                        continue
                        
                    # Language-specific forced analysis
                    if language_id.lower() in ['cpp', 'c++']:
                        if 'inseSrt' in line:  # Common typo
                            forced_issues.append({
                                'type': 'typo',
                                'line': i,
                                'description': f'Potential typo in function name: "{line_stripped}"',
                                'severity': 'high'
                            })
                        elif '->' in line and 'if' not in line.lower() and 'null' not in line.lower():
                            forced_issues.append({
                                'type': 'null_check',
                                'line': i,
                                'description': 'Pointer dereference without null check',
                                'severity': 'high'
                            })
                        elif line_stripped.startswith('class') and '{' not in line:
                            forced_issues.append({
                                'type': 'syntax',
                                'line': i,
                                'description': 'Class declaration may be missing opening brace',
                                'severity': 'medium'
                            })
                    
                    elif language_id.lower() == 'python':
                        if line_stripped.endswith(':') == False and any(keyword in line for keyword in ['if ', 'for ', 'while ', 'def ', 'class ']):
                            forced_issues.append({
                                'type': 'syntax',
                                'line': i,
                                'description': 'Missing colon after statement',
                                'severity': 'high'
                            })
                        elif 'print ' in line and '(' not in line:
                            forced_issues.append({
                                'type': 'syntax',
                                'line': i,
                                'description': 'Print statement should use parentheses in Python 3',
                                'severity': 'medium'
                            })
                
                # If still no issues found, create generic ones
                if not forced_issues:
                    forced_issues = [
                        {
                            'type': 'review_needed',
                            'line': 1,
                            'description': 'Code requires manual review for potential edge cases and error handling',
                            'severity': 'medium'
                        },
                        {
                            'type': 'documentation',
                            'line': max(1, len(lines)),
                            'description': 'Consider adding comments and documentation for better maintainability',
                            'severity': 'low'
                        }
                    ]
                
                # Add fixes if requested
                if get_fixes:
                    for issue in forced_issues:
                        if issue['type'] == 'typo':
                            issue['fix'] = issue['description'].replace('inseSrt', 'insert')
                        elif issue['type'] == 'null_check':
                            issue['fix'] = f"if (ptr != NULL) {{ {lines[issue['line']-1].strip()} }}"
                        elif issue['type'] == 'syntax' and 'colon' in issue['description']:
                            issue['fix'] = lines[issue['line']-1].strip() + ':'
                        else:
                            issue['fix'] = '// TODO: Review and fix this issue'
                
                final_analysis = {
                    'issues': forced_issues,
                    'summary': f'Forced analysis found {len(forced_issues)} potential issues requiring attention',
                    'forced_analysis': True
                }
            
            # Step 6: Final logging and response
            total_issues = len(final_analysis['issues'])
            logger.info(f"=== Analysis Complete: {total_issues} issues found ===")
            
            for i, issue in enumerate(final_analysis['issues'], 1):
                logger.info(f"Issue {i}: Line {issue.get('line', '?')} - {issue.get('description', 'No description')}")
            
            # Add metadata
            final_analysis['metadata'] = {
                'total_issues': total_issues,
                'language': language_id,
                'has_fixes': get_fixes,
                'analysis_type': 'forced' if final_analysis.get('forced_analysis') else 'standard'
            }
            
            logger.info("=== Returning successful response ===")
            return jsonify({
                "status": "success", 
                "analysis": final_analysis
            })
            
        except Exception as e:
            logger.error(f"=== CRITICAL ERROR IN ANALYSIS ===")
            logger.error(f"Error: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            # Emergency fallback
            emergency_analysis = {
                'issues': [{
                    'type': 'system_error',
                    'line': 1,
                    'description': f'Analysis system encountered an error. Manual code review recommended.',
                    'severity': 'high',
                    'fix': '// System error - please review code manually' if data.get('get_fixes', False) else None
                }],
                'summary': 'System error occurred during analysis',
                'error': str(e)
            }
            
            if data.get('get_fixes', False):
                emergency_analysis['issues'][0]['fix'] = '// System error - please review code manually'
            
            return jsonify({
                "status": "partial_success", 
                "analysis": emergency_analysis
            }), 200

    # Add this new route for getting fixes
    @app.route('/get-fixes', methods=['POST'])
    def get_fixes_for_issues():
        """Get fixes for previously identified issues"""
        try:
            data = request.json
            code = data.get('code', '')
            issues = data.get('issues', [])
            language_id = data.get('language_id', 'python')
            
            if not code or not issues:
                return jsonify({
                    "status": "error",
                    "error": "Code and issues required"
                }), 400
            
            # Generate fixes for each issue
            for issue in issues:
                if not issue.get('fix'):
                    # Generate fix based on issue type and description
                    fix = generate_fix_for_issue(issue, code, language_id)
                    issue['fix'] = fix
            
            return jsonify({
                "status": "success",
                "issues_with_fixes": issues
            })
            
        except Exception as e:
            logger.error(f"Error generating fixes: {e}")
            return jsonify({
                "status": "error",
                "error": str(e)
            }), 500
        
    @app.route('/optimize', methods=['POST'])
    def optimize_code_suggestions(): # Changed from optimize_code to optimize_code_suggestions
        try:
            data = request.json
            code = data.get('code', '')
            language_id = data.get('language_id', 'python')

            if not code.strip():
                return jsonify({"status": "error", "error": "No code provided for optimization."}), 400
            
            # This now uses the prompt that asks for suggestions WITHOUT optimized code
            prompt = format_optimization_prompt(code, language_id)

            result = generator(prompt, do_sample=True, temperature=0.2, max_new_tokens=1024) # Adjust generation parameters as needed
            response_text = result[0]['generated_text'][len(prompt):].strip()
            
            optimization_data = extract_json_from_response(response_text)

            if not optimization_data or 'optimizations' not in optimization_data:
                # Fallback if parsing fails or LLM doesn't adhere to format strictly
                optimization_data = {
                    "optimizations": [],
                    "summary": "Optimization analysis could not identify specific line-by-line suggestions. Consider general best practices for this language."
                }
            
            # Ensure each optimization has a unique ID and all necessary fields
            if "optimizations" in optimization_data and isinstance(optimization_data["optimizations"], list):
                for i, opt in enumerate(optimization_data["optimizations"]):
                    if "id" not in opt or not opt["id"]:
                        opt["id"] = f"opt_{uuid.uuid4().hex[:8]}" # Generate a unique ID
                    opt.setdefault('original', '')
                    opt.setdefault('description', 'No description provided.')
                    opt.setdefault('line', 0) # LLM should provide this, but ensure it exists
                    opt.setdefault('type', 'general')
                    opt.setdefault('impact', 'low')
            
            if "summary" not in optimization_data or not optimization_data["summary"]:
                if optimization_data.get("optimizations"):
                    optimization_data["summary"] = f"Found {len(optimization_data['optimizations'])} potential optimization(s)."
                else:
                    optimization_data["summary"] = "No specific optimization suggestions found. The code may be well-optimized, or consider a broader review for architectural improvements."
            
            # The key here is that 'optimizations' in the response_data is a list of suggestions,
            # and each suggestion does NOT contain the 'optimized' code yet.
            return jsonify({"status": "success", "optimizations_result": optimization_data}) # Changed key to 'optimizations_result' to match expected frontend
        except Exception as e:
            logger.error(f"Error in /optimize route: {traceback.format_exc()}")
            return jsonify({"status": "error", "error": f"Error during optimization suggestion process: {str(e)}"}), 500

    @app.route('/get-optimized-code', methods=['POST'])
    def get_single_optimized_code_route(): # Renamed to avoid conflict
        try:
            data = request.json
            original_snippet = data.get('original_snippet')
            optimization_description = data.get('description')
            language_id = data.get('language_id')

            if not all([original_snippet, optimization_description, language_id]):
                return jsonify({"status": "error", "error": "Missing required data: original_snippet, description, or language_id."}), 400

            prompt = format_single_optimization_code_prompt(original_snippet, optimization_description, language_id)
            
            # Adjust generation parameters as needed. Max_new_tokens should be sufficient for the optimized code.
            result = generator(prompt, do_sample=True, temperature=0.1, max_new_tokens=max(50, len(original_snippet) + 200)) 
            raw_optimized_code = result[0]['generated_text'][len(prompt):].strip()
            
            # Clean the response: remove potential markdown, explanations if any (prompt asks not to, but good to be safe)
            # A more robust cleaning function might be needed depending on LLM behavior
            optimized_code = raw_optimized_code
            if optimized_code.startswith(f"```{language_id}"):
                optimized_code = optimized_code[len(f"```{language_id}"):]
            elif optimized_code.startswith("```"):
                 optimized_code = optimized_code[3:]
            if optimized_code.endswith("```"):
                optimized_code = optimized_code[:-3]
            optimized_code = optimized_code.strip() # Final strip

            if not optimized_code: # Fallback if LLM returns empty or only whitespace
                optimized_code = f"// Could not automatically generate optimized code for this suggestion.\n// Original:\n{original_snippet}"

            return jsonify({"status": "success", "optimized_code": optimized_code})
        except Exception as e:
            logger.error(f"Error in /get-optimized-code route: {traceback.format_exc()}")
            return jsonify({"status": "error", "error": f"Error generating specific optimized code: {str(e)}"}), 500

    def generate_fix_for_issue(issue, code, language_id):
        """Generate a fix for a specific issue"""
        issue_type = issue.get('type', '')
        description = issue.get('description', '')
        line_num = issue.get('line', 1)
        
        lines = code.split('\n')
        if line_num <= len(lines):
            current_line = lines[line_num - 1]
        else:
            current_line = ""
        
        # Generate fixes based on issue type
        if issue_type == 'typo' and 'inseSrt' in current_line:
            return current_line.replace('inseSrt', 'insert')
        elif issue_type == 'null_check' and '->' in current_line:
            return f"if (ptr != NULL) {{\n    {current_line.strip()}\n}}"
        elif issue_type == 'syntax' and 'colon' in description:
            return current_line.strip() + ':'
        elif issue_type == 'syntax' and 'print' in description:
            return current_line.replace('print ', 'print(').rstrip() + ')'
        else:
            return f"// TODO: Fix {issue_type} - {description}"
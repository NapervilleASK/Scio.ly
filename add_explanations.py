import json
import random
import time
import requests
import sys
import os
import re

# API keys to choose from
API_KEYS = [
    "AIzaSyCeePYMH5HBSXUTveHl4bdmFO4ahBAE_DE", "AIzaSyC5OKLpFadOMx0sbRT2_sZ_K7eIY2lXdTo",
    "AIzaSyCqomCXXxkbHDxvDvIUiK9ZVgYo3A37G0", "AIzaSyDgsQMjAIZOSkJ2NviVynyRm4e5no-xso0",
    "AIzaSyDPGNgvfwwLsblr3Pn-sFlBVk32JkAqRg", "AIzaSyAr2RYSw_BvjtHBFfemY_XMlKJt__SPkfk",
    "AIzaSyCmxaRE45Su7KT0oGifWJZaV9p0zRaNUWU", "AIzaSyAadf7tJuQoiE_BGoFUOyGcxEAeeCtBJIw",
    "AIzaSyD6gVkOJaiU6okLIQfrpcknHHAcmqUTQSg", "AIzaSyBm_QUZnny6jo92p1CkbPOMglV73hUBETQ",
    "AIzaSyCkskTBQMpvckmcIm2bHVbl2kkM9TnTjCA", "AIzaSyBsA_O9vjzhkWAmjyD0KzSFNP0cxB9Yu90",
    "AIzaSyA3_dpqOA67d0tiQ3ayCL69lr2UD3OkDV8", "AIzaSyDHGciTN4papPucYcVU50xMZxii_CeJImE",
    "AIzaSyDX_lsfZLPdy-ZJtwj6z6V03vUoHRIVNYU", "AIzaSyDfi2QkcMCh1JoQgxA70VeZjZONUWMhm4A",
    "AIzaSyACCMbTVB7yCGXFNktKbIXF_NiTEZVw698", "AIzaSyDhXgviXgz03pdZ7yPMUiRrlquuvOUcuYo",
    "AIzaSyDkWDMtwWYKNOs-xlqHD8j4ekWZx6ivqWY", "AIzaSyBLRJQoy4icrP3_fVPyP7Ri7W-yULvrU-A",
    "AIzaSyCcc1SPuC_MIMtbLL3Tm35jjtez9ob6d8s", "AIzaSyCUmZWb4pgY_b_4I9vyWf12dWB_ja3DZzo",
    "AIzaSyDkoP82SFpZxXdOAa3-gqI8AEjlzcsXwNM", "AIzaSyCmjfvRzpwyhJ5Jg7RrLIfVq_MK9wdoq-E",
    "AIzaSyAVWlHTbtoUpo5Io6DMCt38Ih4ncfbDiXo", "AIzaSyBnLq7fxkCumOOB473f7nsqo_CCqIcTGTQ",
    "AIzaSyAgB3MoY7L1ALdXmY2t2N89eqgPAQeeyss", "AIzaSyC8l9t_YNnzTuXsOEiuBkhC390lOw6mV9k",
    "AIzaSyA-GSUkZ7-wtHcbT81JHP31v1OaXPZ4to8", "AIzaSyCNKjY5WL2NtJJfAoI9OOAAIrXWGpmJYpI",
    "AIzaSyDU-wpPBOvBsAvrbe8uY99uLhOK-LQSRPE", "AIzaSyCugPr4zL53bCFqBVArY_gPjKcjQQpc1Xc",
    "AIzaSyBr8iiu1CaTb4ptl0yjNN3ltZ_o7qN12Gk", "AIzaSyAcP0Y4u8qzuz0SKipNSTvvX9WwPz7Jlb4"
]

# Combine all API keys
ALL_API_KEYS = API_KEYS 

def get_random_api_key():
    """Return a random API key from the list."""
    return random.choice(ALL_API_KEYS)

def call_gemini_api(questions_batch, api_key, event_name):
    """Call the Gemini API with a batch of questions."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    
    # Create a copy of the questions without the answers
    questions_for_api = []
    for q in questions_batch:
        q_copy = q.copy()
        if "answers" in q_copy:
            del q_copy["answers"]
        questions_for_api.append(q_copy)
    
    # Prepare the prompt with more explicit instructions
    prompt = f"""
    Process these Science Olympiad questions for the event: {event_name}.
    
    Questions:
    {json.dumps(questions_for_api, indent=2)}
    
    For each question:
    1. Add an "explanation" field with a DETAILED markdown-formatted explanation that:
       - Explains the correct answer thoroughly
       - Provides the scientific reasoning behind the answer
       - Includes relevant formulas, concepts, or principles
       - For multiple-choice questions, explains why the correct option is right and others are wrong
       - For free-response questions, explains the complete solution process
    
    2. Add context to the question field if it references previous parts or is unclear without context
    
    3. Add an "answers" field:
       - Multiple-choice: array with 1-indexed correct answer(s) [1], [2], etc.
       - Free-response: string with the answer
       - Use empty string "" if unanswerable due to missing information or unclear question
    
    REQUIREMENTS:
    - Return EXACTLY {len(questions_batch)} questions
    - Include both "explanation" and "answers" fields for each question INCLUDING FRQs ALL QUESTIONS MUST HAVE EXPLANATIONS
    - Maintain original structure plus these two fields
    - Return ONLY a valid JSON array with no text before or after
    - Do not include any explanatory text, comments, or markdown formatting outside the JSON
    - EVERY question MUST have a detailed explanation, not just a restatement of the answer
    
    Example format:
    {{
      "question": "What is the acceleration due to gravity on Earth?",
      "options": ["5.6 m/s²", "9.8 m/s²", "3.7 m/s²", "11.2 m/s²"],
      "difficulty": 0.5,
      "explanation": "The correct answer is 9.8 m/s². This is the standard acceleration due to gravity on Earth's surface. It represents the rate at which an object's velocity changes when falling freely near Earth's surface, neglecting air resistance. This value varies slightly depending on latitude and altitude, but 9.8 m/s² is the accepted standard value. The other options are incorrect: 5.6 m/s² is not a standard gravitational acceleration for any major body in our solar system; 3.7 m/s² is approximately the gravitational acceleration on Mars; 11.2 m/s² is Earth's escape velocity in km/s, not its gravitational acceleration.",
      "answers": [2]
    }}
    
    Return ONLY a valid JSON array with the updated questions, maintaining the same structure but with explanations added.
    """
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "topP": 0.9,
            "topK": 40,
            "maxOutputTokens": 8192
        }
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()  # This will raise an HTTPError for bad responses
        
        response_json = response.json()
        
        if "candidates" in response_json and len(response_json["candidates"]) > 0:
            candidate = response_json["candidates"][0]
            if "content" in candidate and "parts" in candidate["content"] and len(candidate["content"]["parts"]) > 0:
                text = candidate["content"]["parts"][0]["text"]
                
                # Log the raw response for debugging
                print(f"  Raw response length: {len(text)} characters")
                
                # Try to parse the JSON response directly first
                try:
                    updated_batch = json.loads(text)
                    
                    # Additional validation to ensure correct length and required fields
                    if len(updated_batch) == len(questions_batch):
                        valid_response = True
                        for q in updated_batch:
                            # Check if required fields exist
                            if "explanation" not in q or "answers" not in q:
                                print(f"  Missing required fields in response")
                                valid_response = False
                                break
                            
                            # Check if explanation is too short or just a placeholder
                            explanation = q.get("explanation", "")
                            if len(explanation) < 50 or explanation.lower() in ["explanation", "no explanation", "explanation of the answer"]:
                                print(f"  Insufficient explanation: {explanation[:30]}...")
                                valid_response = False
                                break
                        
                        if valid_response:
                            return updated_batch
                        else:
                            return None
                    else:
                        print(f"  Response length mismatch: expected {len(questions_batch)}, got {len(updated_batch)}")
                        return None
                except json.JSONDecodeError:
                    print(f"  Failed to parse JSON response directly, trying to extract JSON array...")
                    
                    # Try to extract JSON array using regex
                    json_array_pattern = r'\[\s*\{.*\}\s*\]'
                    json_array_match = re.search(json_array_pattern, text, re.DOTALL)
                    
                    if json_array_match:
                        json_array_text = json_array_match.group(0)
                        try:
                            updated_batch = json.loads(json_array_text)
                            
                            # Additional validation to ensure correct length and required fields
                            if len(updated_batch) == len(questions_batch):
                                valid_response = True
                                for q in updated_batch:
                                    # Check if required fields exist
                                    if "explanation" not in q or "answers" not in q:
                                        print(f"  Missing required fields in extracted JSON")
                                        valid_response = False
                                        break
                                    
                                    # Check if explanation is too short or just a placeholder
                                    explanation = q.get("explanation", "")
                                    if len(explanation) < 50 or explanation.lower() in ["explanation", "no explanation", "explanation of the answer"]:
                                        print(f"  Insufficient explanation in extracted JSON: {explanation[:30]}...")
                                        valid_response = False
                                        break
                                
                                if valid_response:
                                    print(f"  Successfully extracted JSON array using regex")
                                    return updated_batch
                                else:
                                    return None
                            else:
                                print(f"  Extracted JSON length mismatch: expected {len(questions_batch)}, got {len(updated_batch)}")
                                return None
                        except json.JSONDecodeError:
                            print(f"  Failed to parse extracted JSON array")
                    
                    # Try to fix common JSON issues
                    print(f"  Attempting to fix JSON formatting issues...")
                    
                    # Remove markdown code block markers
                    cleaned_text = re.sub(r'```json\s*', '', text)
                    cleaned_text = re.sub(r'```\s*', '', cleaned_text)
                    
                    # Find the first '[' and last ']' to extract the JSON array
                    start_idx = cleaned_text.find('[')
                    end_idx = cleaned_text.rfind(']')
                    
                    if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
                        json_text = cleaned_text[start_idx:end_idx+1]
                        try:
                            updated_batch = json.loads(json_text)
                            
                            # Additional validation to ensure correct length and required fields
                            if len(updated_batch) == len(questions_batch):
                                valid_response = True
                                for q in updated_batch:
                                    # Check if required fields exist
                                    if "explanation" not in q or "answers" not in q:
                                        print(f"  Missing required fields in fixed JSON")
                                        valid_response = False
                                        break
                                    
                                    # Check if explanation is too short or just a placeholder
                                    explanation = q.get("explanation", "")
                                    if len(explanation) < 10 or explanation.lower() in ["explanation", "no explanation", "explanation of the answer"]:
                                        print(f"  Insufficient explanation in fixed JSON: {explanation[:30]}...")
                                        valid_response = False
                                        break
                                
                                if valid_response:
                                    print(f"  Successfully fixed JSON formatting issues")
                                    return updated_batch
                                else:
                                    return None
                            else:
                                print(f"  Fixed JSON length mismatch: expected {len(questions_batch)}, got {len(updated_batch)}")
                                return None
                        except json.JSONDecodeError:
                            print(f"  Failed to parse fixed JSON")
                    
                    # If all attempts fail, log the first 200 characters of the response for debugging
                    print(f"  All JSON parsing attempts failed. First 200 chars of response: {text[:200]}")
                    return None
        
        print(f"  Unexpected response format")
        return None
    
    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code
        
        if status_code == 429:
            print(f"  Rate limit exceeded for API key {api_key[:10]}...")
            return None
        elif status_code == 403:
            print(f"  API key {api_key[:10]}... is invalid (403 Forbidden)")
            return None
        else:
            print(f"  HTTP error {status_code}: {str(e)}")
            return None
    
    except Exception as e:
        print(f"  Error calling Gemini API: {str(e)}")
        return None

def process_questions_in_batches(data, output_dir, batch_size=5):
    """Process all questions in batches and update the data."""
    total_events = len(data)
    current_event = 0
    
    # Keep track of invalid and rate-limited API keys
    invalid_keys = set()  # 403 errors - permanently removed
    rate_limited_keys = {}  # 429 errors - temporarily removed with timestamp
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    for event_name, questions in data.items():
        current_event += 1
        print(f"Processing event {current_event}/{total_events}: {event_name} ({len(questions)} questions)")
        
        # Process questions in batches
        for i in range(0, len(questions), batch_size):
            batch = questions[i:i+batch_size]
            print(f"  Processing batch {i//batch_size + 1}/{(len(questions) + batch_size - 1)//batch_size} ({len(batch)} questions)")
            
            success = False
            
            # Get available API keys (excluding invalid and currently rate-limited ones)
            current_time = time.time()
            available_keys = [key for key in ALL_API_KEYS 
                             if key not in invalid_keys and 
                                (key not in rate_limited_keys or current_time > rate_limited_keys[key])]
            
            # If no keys are available, check if any rate-limited keys can be restored
            if not available_keys:
                print("  No available API keys. Waiting for rate-limited keys to become available...")
                # Find the key with the earliest timeout
                if rate_limited_keys:
                    earliest_available = min(rate_limited_keys.values())
                    wait_time = max(0, earliest_available - current_time)
                    if wait_time > 0:
                        print(f"  Waiting {wait_time:.1f} seconds for rate-limited keys...")
                        time.sleep(wait_time)
                    
                    # Recalculate available keys
                    current_time = time.time()
                    available_keys = [key for key in ALL_API_KEYS 
                                     if key not in invalid_keys and 
                                        (key not in rate_limited_keys or current_time > rate_limited_keys[key])]
            
            # If still no keys available, we can't continue
            if not available_keys:
                print("  No API keys available. Skipping this batch.")
                continue
            
            # Randomize the order of available keys
            random.shuffle(available_keys)
            
            while available_keys and not success:
                api_key = available_keys.pop(0)
                print(f"  Using API key: {api_key[:10]}...")
                
                try:
                    updated_batch = call_gemini_api(batch, api_key, event_name)
                    
                    if updated_batch and len(updated_batch) == len(batch):
                        # Validate that each question has an explanation field and valid answers
                        all_valid = True
                        for q in updated_batch:
                            # Check if explanation and answers fields exist
                            if "explanation" not in q or "answers" not in q:
                                all_valid = False
                                print(f"  Question missing required fields")
                                break
                            
                            # Check if explanation is too short or just a placeholder
                            explanation = q.get("explanation", "")
                            if len(explanation) < 50 or explanation.lower() in ["explanation", "no explanation", "explanation of the answer"]:
                                all_valid = False
                                print(f"  Question has insufficient explanation: {explanation[:30]}...")
                                break
                        
                        if all_valid:
                            # Replace the original batch with the updated one
                            questions[i:i+batch_size] = updated_batch
                            success = True
                            
                            # Save progress after each successful batch
                            event_filename = os.path.join(output_dir, f"{event_name.replace('/', '_').replace(' ', '_')}.json")
                            try:
                                with open(event_filename, 'w') as f:
                                    json.dump(questions, f, indent=2)
                                print(f"  Batch processed successfully and saved to {event_filename}")
                            except Exception as save_error:
                                print(f"  Error saving progress: {str(save_error)}")
                        else:
                            print(f"  Invalid response (missing fields). Trying next API key...")
                    else:
                        if updated_batch is None:
                            print(f"  Failed to get valid response. Trying next API key...")
                        else:
                            print(f"  Response length mismatch: expected {len(batch)}, got {len(updated_batch)}. Trying next API key...")
                
                except requests.exceptions.HTTPError as e:
                    status_code = e.response.status_code
                    
                    if status_code == 403:
                        print(f"  API key {api_key[:10]}... is invalid (403 Forbidden). Removing from available keys.")
                        invalid_keys.add(api_key)
                    elif status_code == 429:
                        # Rate limited - add to rate_limited_keys with a timeout
                        timeout = current_time + 60  # Default 60 second timeout
                        
                        # Try to extract retry-after header
                        retry_after = e.response.headers.get('retry-after')
                        if retry_after:
                            try:
                                timeout = current_time + int(retry_after)
                            except ValueError:
                                pass  # Use default timeout
                        
                        print(f"  API key {api_key[:10]}... is rate limited. Will retry after {int(timeout - current_time)} seconds.")
                        rate_limited_keys[api_key] = timeout
                    else:
                        print(f"  HTTP error {status_code}: {str(e)}")
                
                except Exception as e:
                    print(f"  Error processing batch: {str(e)}")
                
                # If this API key didn't work, wait before trying the next one
                if not success:
                    time.sleep(2)  # Wait before trying next API key
            
            # If batch processing failed, try processing individual questions
            if not success:
                print(f"  Batch processing failed. Trying to process individual questions...")
                
                # Process each question individually
                individual_success = False
                updated_individual_questions = []
                
                for j, question in enumerate(batch):
                    print(f"  Processing individual question {j+1}/{len(batch)}")
                    
                    # Get available API keys again
                    current_time = time.time()
                    available_keys = [key for key in ALL_API_KEYS 
                                     if key not in invalid_keys and 
                                        (key not in rate_limited_keys or current_time > rate_limited_keys[key])]
                    
                    if not available_keys:
                        print(f"  No available API keys for individual question. Skipping.")
                        updated_individual_questions.append(question)  # Keep original question
                        continue
                    
                    # Try each available API key
                    question_success = False
                    random.shuffle(available_keys)
                    
                    for api_key in available_keys:
                        if question_success:
                            break
                            
                        print(f"  Using API key: {api_key[:10]}... for individual question")
                        
                        try:
                            updated_question = call_gemini_api_single_question(question, api_key, event_name)
                            
                            if updated_question and "explanation" in updated_question and "answers" in updated_question:
                                # Check if explanation is sufficient
                                explanation = updated_question.get("explanation", "")
                                if len(explanation) >= 50 and explanation.lower() not in ["explanation", "no explanation", "explanation of the answer"]:
                                    updated_individual_questions.append(updated_question)
                                    question_success = True
                                    individual_success = True
                                    print(f"  Individual question processed successfully")
                                else:
                                    print(f"  Insufficient explanation for individual question. Trying next API key...")
                            else:
                                print(f"  Failed to get valid response for individual question. Trying next API key...")
                        
                        except Exception as e:
                            print(f"  Error processing individual question: {str(e)}")
                    
                    # If all API keys failed for this question, keep the original
                    if not question_success:
                        print(f"  All API keys failed for individual question. Keeping original.")
                        updated_individual_questions.append(question)
                
                # If any individual questions were processed successfully, update the batch
                if individual_success:
                    questions[i:i+len(updated_individual_questions)] = updated_individual_questions
                    
                    # Save progress after processing individual questions
                    event_filename = os.path.join(output_dir, f"{event_name.replace('/', '_').replace(' ', '_')}.json")
                    try:
                        with open(event_filename, 'w') as f:
                            json.dump(questions, f, indent=2)
                        print(f"  Individual questions processed and saved to {event_filename}")
                    except Exception as save_error:
                        print(f"  Error saving progress: {str(save_error)}")
            
            # Add a small delay between batches to avoid rate limiting
            time.sleep(1)
        
        # Save the processed event data to its own file
        event_filename = os.path.join(output_dir, f"{event_name.replace('/', '_').replace(' ', '_')}.json")
        try:
            with open(event_filename, 'w') as f:
                json.dump(questions, f, indent=2)
            print(f"  Saved event data to {event_filename}")
        except Exception as e:
            print(f"  Error saving event data: {str(e)}")
    
    # Print summary of key status
    print("\nAPI Key Status Summary:")
    print(f"  Invalid keys (403): {len(invalid_keys)}")
    print(f"  Rate-limited keys: {len(rate_limited_keys)}")
    print(f"  Available keys: {len(ALL_API_KEYS) - len(invalid_keys) - len(rate_limited_keys)}")
    
    return data

def call_gemini_api_single_question(question, api_key, event_name):
    """Call the Gemini API with a single question when batch processing fails."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    
    # Create a copy of the question without the answers
    q_copy = question.copy()
    if "answers" in q_copy:
        del q_copy["answers"]
    
    # Prepare the prompt with more explicit instructions
    prompt = f"""
    Process this Science Olympiad question for the event: {event_name}.
    
    Question:
    {json.dumps(q_copy, indent=2)}
    
    Add to this question:
    1. An "explanation" field with a DETAILED markdown-formatted explanation that:
       - Explains the correct answer thoroughly
       - Provides the scientific reasoning behind the answer
       - Includes relevant formulas, concepts, or principles
       - For multiple-choice questions, explains why the correct option is right and others are wrong
       - For free-response questions, explains the complete solution process
    
    2. Add context to the question field if it references previous parts or is unclear without context
    
    3. Add an "answers" field:
       - Multiple-choice: array with 1-indexed correct answer(s) [1], [2], etc.
       - Free-response: string with the answer
       - Use empty string "" if unanswerable due to missing information or unclear question
    
    REQUIREMENTS:
    - Include both "explanation" and "answers" fields
    - Maintain original structure plus these two fields
    - Return ONLY a valid JSON object with no text before or after
    - Do not include any explanatory text, comments, or markdown formatting outside the JSON
    - The explanation MUST be detailed and thorough, not just a restatement of the answer
    
    Example format:
    {{
      "question": "What is the acceleration due to gravity on Earth?",
      "options": ["5.6 m/s²", "9.8 m/s²", "3.7 m/s²", "11.2 m/s²"],
      "difficulty": 0.5,
      "explanation": "The correct answer is 9.8 m/s². This is the standard acceleration due to gravity on Earth's surface. It represents the rate at which an object's velocity changes when falling freely near Earth's surface, neglecting air resistance. This value varies slightly depending on latitude and altitude, but 9.8 m/s² is the accepted standard value. The other options are incorrect: 5.6 m/s² is not a standard gravitational acceleration for any major body in our solar system; 3.7 m/s² is approximately the gravitational acceleration on Mars; 11.2 m/s² is Earth's escape velocity in km/s, not its gravitational acceleration.",
      "answers": [2]
    }}
    
    Return ONLY a valid JSON object for this single question.
    """
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "topP": 0.9,
            "topK": 40,
            "maxOutputTokens": 8192
        }
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        response_json = response.json()
        
        if "candidates" in response_json and len(response_json["candidates"]) > 0:
            candidate = response_json["candidates"][0]
            if "content" in candidate and "parts" in candidate["content"] and len(candidate["content"]["parts"]) > 0:
                text = candidate["content"]["parts"][0]["text"]
                
                # Log the raw response for debugging
                print(f"  Raw response length: {len(text)} characters")
                
                # Try to parse the JSON response directly first
                try:
                    updated_question = json.loads(text)
                    
                    # Validate the response
                    if "explanation" not in updated_question or "answers" not in updated_question:
                        print(f"  Missing required fields in response")
                        return None
                    
                    # Check if explanation is too short or just a placeholder
                    explanation = updated_question.get("explanation", "")
                    if len(explanation) < 50 or explanation.lower() in ["explanation", "no explanation", "explanation of the answer"]:
                        print(f"  Insufficient explanation: {explanation[:30]}...")
                        return None
                    
                    return updated_question
                except json.JSONDecodeError:
                    print(f"  Failed to parse JSON response directly, trying to extract JSON object...")
                    
                    # Try to extract JSON object using regex
                    json_object_pattern = r'\{\s*".*"\s*:.*\}'
                    json_object_match = re.search(json_object_pattern, text, re.DOTALL)
                    
                    if json_object_match:
                        json_object_text = json_object_match.group(0)
                        try:
                            updated_question = json.loads(json_object_text)
                            
                            # Validate the response
                            if "explanation" not in updated_question or "answers" not in updated_question:
                                print(f"  Missing required fields in extracted JSON")
                                return None
                            
                            # Check if explanation is too short or just a placeholder
                            explanation = updated_question.get("explanation", "")
                            if len(explanation) < 50 or explanation.lower() in ["explanation", "no explanation", "explanation of the answer"]:
                                print(f"  Insufficient explanation in extracted JSON: {explanation[:30]}...")
                                return None
                            
                            print(f"  Successfully extracted JSON object using regex")
                            return updated_question
                        except json.JSONDecodeError:
                            print(f"  Failed to parse extracted JSON object")
                    
                    # Try to fix common JSON issues
                    print(f"  Attempting to fix JSON formatting issues...")
                    
                    # Remove markdown code block markers
                    cleaned_text = re.sub(r'```json\s*', '', text)
                    cleaned_text = re.sub(r'```\s*', '', cleaned_text)
                    
                    # Find the first '{' and last '}' to extract the JSON object
                    start_idx = cleaned_text.find('{')
                    end_idx = cleaned_text.rfind('}')
                    
                    if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
                        json_text = cleaned_text[start_idx:end_idx+1]
                        try:
                            updated_question = json.loads(json_text)
                            
                            # Validate the response
                            if "explanation" not in updated_question or "answers" not in updated_question:
                                print(f"  Missing required fields in fixed JSON")
                                return None
                            
                            # Check if explanation is too short or just a placeholder
                            explanation = updated_question.get("explanation", "")
                            if len(explanation) < 50 or explanation.lower() in ["explanation", "no explanation", "explanation of the answer"]:
                                print(f"  Insufficient explanation in fixed JSON: {explanation[:30]}...")
                                return None
                            
                            print(f"  Successfully fixed JSON formatting issues")
                            return updated_question
                        except json.JSONDecodeError:
                            print(f"  Failed to parse fixed JSON")
                    
                    # If all attempts fail, log the first 200 characters of the response for debugging
                    print(f"  All JSON parsing attempts failed. First 200 chars of response: {text[:200]}")
                    return None
        
        print(f"  Unexpected response format")
        return None
    
    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code
        
        if status_code == 429:
            print(f"  Rate limit exceeded for API key {api_key[:10]}...")
            return None
        elif status_code == 403:
            print(f"  API key {api_key[:10]}... is invalid (403 Forbidden)")
            return None
        else:
            print(f"  HTTP error {status_code}: {str(e)}")
            return None
    
    except Exception as e:
        print(f"  Error calling Gemini API: {str(e)}")
        return None

def main():
    # Use the newer dataset from the provided URL
    input_url = "https://gist.githubusercontent.com/Kudostoy0u/9b2d7eadbaa6c2072cbf84d6b37f7235/raw/7172f14c9f1417e0bfbfc42977ec55d2567ec7d4/final.json"
    output_dir = "explanations_by_event"
    
    # Define the events to process
    events_to_process = [
        "Anatomy - Skeletal",
        "Anatomy - Muscular",
        "Anatomy - Integumentary",
        "Astronomy",
        "Cell Biology", 
        "Chemistry Lab",
        "Codebusters", 
        "Crime Busters", 
        "Disease Detectives", 
        "Dynamic Planet - Glaciers",
        "Ecology", 
        "Entomology", 
        "Environmental Chemistry",
        "Forensics",
        "Fossils",
        "Geologic Mapping",
        "Green Generation",
        "Materials Science",
        "Meteorology",
        "Metric Mastery",
        "Microbe Mission", 
        "Optics", 
        "Potions and Poisons", 
        "Wind Power"
    ]
    
    # Load the data from URL
    try:
        response = requests.get(input_url)
        response.raise_for_status()
        data = response.json()
        print(f"Successfully loaded data from URL: {input_url}")
    except Exception as e:
        print(f"Error loading data from URL: {str(e)}")
        return
    
    # Filter data to only include specified events
    filtered_data = {event: questions for event, questions in data.items() 
                    if event in events_to_process}
    
    if not filtered_data:
        print("No matching events found in the input file.")
        return
    
    print(f"Processing {len(filtered_data)} events: {', '.join(filtered_data.keys())}")
    
    # Process the filtered data
    updated_data = process_questions_in_batches(filtered_data, output_dir)
    
    # Filter out questions with empty answers before saving
    filtered_updated_data = {}
    total_removed = 0
    
    for event, questions in updated_data.items():
        # Keep track of original question count
        original_count = len(questions)
        
        # Filter out questions with empty answers
        filtered_questions = []
        for q in questions:
            # Skip questions with empty answers array, empty string answer, or array with empty string
            # But keep FRQs that have empty options array
            if "answers" in q:
                # Case 1: Empty array
                if isinstance(q["answers"], list) and len(q["answers"]) == 0:
                    if not (isinstance(q.get("options", []), list) and len(q.get("options", [])) == 0):
                        # Skip if it's not an FRQ with empty options
                        continue
                
                # Case 2: Array with empty string
                if isinstance(q["answers"], list) and len(q["answers"]) == 1 and q["answers"][0] == "":
                    continue
                
                # Case 3: Empty string
                if isinstance(q["answers"], str) and q["answers"] == "":
                    continue
                
                # If we got here, the question has valid answers
                filtered_questions.append(q)
            else:
                # Keep questions without answers field (though this shouldn't happen)
                filtered_questions.append(q)
        
        # Calculate how many questions were removed
        removed_count = original_count - len(filtered_questions)
        total_removed += removed_count
        
        # Save the filtered questions
        filtered_updated_data[event] = filtered_questions
        
        # Save the filtered event data to its own file
        event_filename = os.path.join(output_dir, f"{event.replace('/', '_').replace(' ', '_')}.json")
        try:
            with open(event_filename, 'w') as f:
                json.dump(filtered_questions, f, indent=2)
            print(f"  Saved filtered event data to {event_filename} (removed {removed_count} questions)")
        except Exception as e:
            print(f"  Error saving filtered event data: {str(e)}")
    
    # Create a combined file with all filtered events
    combined_output_file = "final_with_explanations.json"
    for event, questions in filtered_updated_data.items():
        data[event] = questions
    
    with open(combined_output_file, 'w') as f:
        json.dump(data, f)
    
    print(f"Processing complete. Individual event files saved to {output_dir}/")
    print(f"Combined results saved to {combined_output_file}")
    print(f"Total questions removed due to empty answers: {total_removed}")

if __name__ == "__main__":
    main() 
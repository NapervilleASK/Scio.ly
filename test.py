import os
import json
import re
# -- Google Drive authentication imports --
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
# -- Gemini API client (assumed to be available) --
import genai

# ----- Global Parameters -----
GOOGLE_DRIVE_CREDENTIALS_FILE = 'credentials.json'
TOKEN_FILE = 'token.json'
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

GEMINI_API_KEY = [
    "AIzaSyCeePYMH5HBSXUTveHl4bdmFO4ahBAE_DE",
    "AIzaSyC5OKLpFadOMx0sbRT2_sZ_K7eIY2lXdTo",
    "AIzaSyCqomCXXxkbHDxvDvIUiK9ZVgYo3_A37G0",
    "AIzaSyDgsQMjAIZOSkJ2NviVynyRm4e5no-xso0",
    "AIzaSyDPGNgvfwwLsblr3Pn_-sFlBVk32JkAqRg",
    "AIzaSyAr2RYSw_BvjtHBFfemY_XMlKJt__SPkfk",
    "AIzaSyCmxaRE45Su7KT0oGifWJZaV9p0zRaNUWU",
    "AIzaSyAadf7tJuQoiE_BGoFUOyGcxEAeeCtBJIw",
    "AIzaSyD6gVkOJaiU6okLIQfrpcknHHAcmqUTQSg",
    "AIzaSyBm_QUZnny6jo92p1CkbPOMglV73hUBETQ",
    "AIzaSyCkskTBQMpvckmcIm2bHVbl2kkM9TnTjCA",
    "AIzaSyBsA_O9vjzhkWAmjyD0KzSFNP0cxB9Yu90"
]

OUTPUT_DIR = "extracted_questions"

# ----- Google Drive Authentication Function -----
def authenticate_google_drive():
    """Authenticates with Google Drive API and obtains token.json."""
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"Error refreshing credentials: {e}")
                os.remove(TOKEN_FILE)  # Invalidate the potentially bad token
                creds = None  # Force re-authentication
        if not creds or not creds.valid:
            flow = InstalledAppFlow.from_client_secrets_file(
                GOOGLE_DRIVE_CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
    try:
        service = build('drive', 'v3', credentials=creds)
        return service
    except HttpError as error:
        print(f'An error occurred: {error}')
        return None

# ----- Utility: Check if a question's answers field is "empty" -----
def has_empty_answers(question):
    answers = question.get("answers")
    return answers in ([], [""], [[""]],[[]])

# ----- Gemini API call for updating empty-answer questions -----
def update_empty_answer_questions_with_gemini(missing_questions, idx):
    """
    Given a list of questions with empty answers, builds a prompt for Gemini and returns its output.
    """
    # Prepare the questions text as formatted JSON
    questions_text = json.dumps(missing_questions, indent=2)
    prompt = f"""
For the following multiple-choice questions that currently have an empty 'answers' field, please determine if the question is answerable.
- If the question is answerable, provide the correct answer(s) in the 'answers' field (using 1-indexed numbering based on the 'options' list).
- If the question is unanswerable, leave the 'answers' field as an empty array.
Keep the original 'question', 'options', and 'difficulty' fields intact.
Output the updated questions as a JSON array following this schema:
[
  {{
    "question": "Question text",
    "options": ["Option 1", "Option 2", ...],
    "answers": [1],  // (or [] if unanswerable)
    "difficulty": 0.5
  }},
  ...
]

Questions:
{questions_text}
"""
    try:
        # Rotate through API keys if needed
        client = genai.Client(api_key=GEMINI_API_KEY[idx % len(GEMINI_API_KEY)])
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        if response and response.text:
            return response.text
        else:
            print("Gemini API returned an empty response.")
            return None
    except Exception as e:
        print("Error interacting with Gemini API: ", e)
        # Retry with the next API key index
        return update_empty_answer_questions_with_gemini(missing_questions, idx+1)

# ----- Gemini Output Parsing -----
def parse_gemini_output(gemini_output, file_name=""):
    """
    Attempts to extract and JSON-parse a JSON array from the Gemini output.
    """
    try:
        # Expecting a JSON array (starting with '[' and ending with ']')
        questions_json_str = re.search(r"\[.*\]", gemini_output, re.DOTALL).group(0)
        parsed = json.loads(questions_json_str)
        return parsed
    except Exception as e:
        try:
            # Attempt a simple fix if needed
            questions_json_str = re.search(r"\[.*\]", gemini_output, re.DOTALL).group(0)
            parsed = json.loads(questions_json_str + "]")
            return parsed
        except Exception as e:
            print(f"Error decoding Gemini JSON output for {file_name}: {e}")
            with open("failed.json", 'a', encoding="utf-8") as writefile2:
                writefile2.write(gemini_output)
            return []

# ----- Process a Single Line from beta_bank.json -----
def process_line(line, gemini_key_idx=0):
    """
    For a given JSON object (as a line), filter out questions with empty answers,
    ask Gemini to update them, then merge the updated questions back in.
    """
    try:
        data = json.loads(line)
    except json.JSONDecodeError:
        print("Invalid JSON line, skipping:", line)
        return line  # Return original line if invalid
    
    updated_data = {}
    # Process each top-level key
    for key, questions in data.items():
        if isinstance(questions, list):
            # Extract questions with empty answers
            missing_questions = [q for q in questions if has_empty_answers(q)]
            # Retain questions that already have proper answers
            retained_questions = [q for q in questions if not has_empty_answers(q)]
            
            if missing_questions:
                print(f"Processing {len(missing_questions)} missing questions for key '{key}'")
                gemini_output = update_empty_answer_questions_with_gemini(missing_questions, gemini_key_idx)
                if gemini_output:
                    updated_questions = parse_gemini_output(gemini_output, file_name=key)
                else:
                    updated_questions = []
                # Replace the old (empty) questions with the updated ones from Gemini
                combined_questions = retained_questions + updated_questions
            else:
                combined_questions = questions
            updated_data[key] = combined_questions
        else:
            # For non-list values, leave them as-is
            updated_data[key] = questions
    return json.dumps(updated_data, ensure_ascii=False)

# ----- Main Processing Function -----
def main():
    input_file = "beta_bank.json"
    output_file = "beta_bank_updated.json"
    
    if not os.path.exists(input_file):
        print(f"Input file {input_file} does not exist.")
        return
    
    with open(input_file, "r", encoding="utf-8") as infile, open(output_file, "w", encoding="utf-8") as outfile:
        for idx, line in enumerate(infile):
            # Process each line (each representing a separate JSON object)
            updated_line = process_line(line, gemini_key_idx=idx)
            outfile.write(updated_line + "\n")
    print(f"Updated file written to {output_file}")

if __name__ == "__main__":
    main()

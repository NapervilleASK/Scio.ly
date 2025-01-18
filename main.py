from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import requests
import io
import os
from pdfminer.high_level import extract_text  # For PDF to text conversion
import google.generativeai as genai  # For Gemini API
import json

# Sample list of Google Drive folder links (replace with your actual links)
folder_links = [
    "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_1?usp=sharing",
    "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_2?usp=sharing",
    # Add more folder links here
]

# Sample list of science olympiad events
events = [
    "ecology",
    "codebusters",
    "anatomy and physiology",
    "disease detectives",
    # Add all your events here
]

# --- 1. Google Drive API Setup ---
def authenticate_google_drive():
    """Authenticates with Google Drive API."""
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', ['https://www.googleapis.com/auth/drive.readonly'])
    if not creds or not creds.valid:
        # Follow Google's OAuth flow to obtain or refresh credentials
        print("Please follow the instructions to authenticate with Google Drive.")
        # ... (Implementation for obtaining/refreshing credentials using google-auth-oauthlib)
        # ... (Store the credentials in 'token.json')
        pass  # Replace with actual authentication code
    try:
        service = build('drive', 'v3', credentials=creds)
        return service
    except HttpError as error:
        print(f'An error occurred: {error}')
        return None

def list_files_in_folder(service, folder_id):
    """Lists all PDF files in a given Google Drive folder."""
    try:
        results = service.files().list(
            q=f"'{folder_id}' in parents and mimeType='application/pdf'",
            fields="nextPageToken, files(id, name)"
        ).execute()
        items = results.get('files', [])
        return items
    except HttpError as error:
        print(f'An error occurred: {error}')
        return []

def download_file(service, file_id, filename):
    """Downloads a file from Google Drive."""
    try:
        request = service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = requests.adapters.HTTPAdapter(max_retries=3)
        session = requests.Session()
        session.mount('https://', downloader)
        response = session.get(request.uri, stream=True)
        response.raise_for_status()
        for chunk in response.iter_content(chunk_size=4096):
            fh.write(chunk)
        with open(filename, 'wb') as f:
            f.write(fh.getvalue())
        return True
    except HttpError as error:
        print(f'An error occurred: {error}')
        return False

# --- 2. Convert PDF to Text ---
def pdf_to_text(pdf_path):
    """Converts a PDF file to plain text."""
    try:
        text = extract_text(pdf_path)
        return text
    except Exception as e:
        print(f"Error converting PDF to text: {e}")
        return None

# --- 3. Gemini API Interaction ---
def initialize_gemini_api(api_key):
    """Initializes the Gemini API client."""
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-pro')  # Or the model you prefer
    return model

def extract_questions_with_gemini(model, text, events):
    """Sends text to Gemini API and extracts multiple-choice questions with event detection."""
    prompt = f"""
    Analyze the following text, which contains Science Olympiad multiple-choice questions.
    Identify the event this test most likely belongs to from the following list: {', '.join(events)}.
    Extract all multiple-choice questions and format them as a JSON object where the key is the detected event name,
    and the value is a list of dictionaries, each representing a question with 'question' and 'options' keys.
    The 'options' should be a list of the multiple-choice options.

    Text:
    ```{text}```

    Example JSON output format:
    {{
      "ecology": [
        {{
          "question": "What is the primary role of decomposers in an ecosystem?",
          "options": ["Producing energy", "Breaking down dead organic matter", "Consuming producers", "Providing shelter"]
        }},
        {{
          "question": "Which of the following is an example of a symbiotic relationship?",
          "options": ["Predation", "Competition", "Mutualism", "Parasitism"]
        }}
      ]
    }}
    """
    try:
        response = model.generate_content(prompt)
        if response.parts:
            return response.parts[0].text
        else:
            print("Gemini API returned an empty response.")
            return None
    except Exception as e:
        print(f"Error interacting with Gemini API: {e}")
        return None

# --- Main Execution ---
if __name__ == "__main__":
    # --- Configuration ---
    GOOGLE_DRIVE_CREDENTIALS_FILE = 'credentials.json'  # You might need to create this
    GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"  # Replace with your actual Gemini API key
    OUTPUT_DIR = "extracted_questions"
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # --- Initialize APIs ---
    drive_service = authenticate_google_drive()
    if not drive_service:
        exit()
    gemini_model = initialize_gemini_api(GEMINI_API_KEY)
    if not gemini_model:
        exit()

    all_extracted_questions = {}

    # --- Process Folders and Files ---
    for folder_link in folder_links:
        try:
            folder_id = folder_link.split('/')[-1].split('?')[0]
        except IndexError:
            print(f"Invalid Google Drive folder link: {folder_link}")
            continue

        files = list_files_in_folder(drive_service, folder_id)
        if files:
            print(f"Processing folder: {folder_id}")
            for file in files:
                if file['name'].lower().endswith('.pdf'):
                    print(f"  Downloading file: {file['name']}")
                    pdf_path = os.path.join(OUTPUT_DIR, file['name'])
                    if download_file(drive_service, file['id'], pdf_path):
                        print(f"  Converting {file['name']} to text...")
                        text_content = pdf_to_text(pdf_path)
                        if text_content:
                            print(f"  Extracting questions using Gemini...")
                            gemini_output = extract_questions_with_gemini(gemini_model, text_content, events)
                            if gemini_output:
                                try:
                                    questions_json = json.loads(gemini_output)
                                    for event, questions in questions_json.items():
                                        if event not in all_extracted_questions:
                                            all_extracted_questions[event] = []
                                        all_extracted_questions[event].extend(questions)
                                    print(f"  Extracted questions for event(s): {', '.join(questions_json.keys())}")
                                except json.JSONDecodeError as e:
                                    print(f"  Error decoding Gemini JSON output for {file['name']}: {e}")
                                    print(f"  Gemini Output:\n{gemini_output}")
                        os.remove(pdf_path) # Clean up the downloaded PDF
        else:
            print(f"No PDF files found in folder: {folder_id}")

    # --- Save the Extracted Questions ---
    output_json_path = os.path.join(OUTPUT_DIR, "all_questions.json")
    with open(output_json_path, 'w') as f:
        json.dump(all_extracted_questions, f, indent=2)

    print(f"\nAll extracted questions saved to: {output_json_path}")
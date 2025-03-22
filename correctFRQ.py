import json
import google.generativeai as genai
import random
from joblib import Parallel, delayed


GEMINI_API_KEYS = []
def call_gemini(prompt: str) -> str:
    """
    Calls the Gemini 2 API with the provided prompt using one of the API keys.
    Returns the response text.
    """
    print('calling')
    api_key = random.choice(GEMINI_API_KEYS)
    genai.configure(api_key=api_key)
    try:
        # Using the Gemini 2.0 flash experiment model.
        response = genai.GenerativeModel("gemini-1.5-flash").generate_content(prompt)
        if response and hasattr(response, 'text'):
            return response.text.strip()
        else:
            print("Gemini response empty or missing text.")
            return ""
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return ""

def evaluate_question(question: dict) -> dict:
    """
    Given a question (a dictionary containing at least a "question" key),
    this function calls Gemini asking if it can be answered as is.
    The Gemini call is expected to return only YES or NO.
    If YES is returned, the original question is kept; otherwise it is filtered out.
    """
    question_text = question.get("question", "")
    prompt = (
        f"Can the following question be answered as is? "
        f"Respond with only YES or NO.\n\nQuestion: {question_text}"
    )
    result = call_gemini(prompt)
    if result.strip().upper() == "YES":
        return question
    else:
        return None

def process_test_entry(test_entry: dict) -> dict:
    """
    Processes one test entry (a dict with subjects as keys and question lists as values).
    For each subject, it sends a Gemini call in parallel for every question in that subject.
    It then filters out any question that does not return YES.
    Returns a new test entry with only the filtered questions.
    """
    filtered_entry = {}
    for subject, questions in test_entry.items():
        # Evaluate all questions in parallel.
        results = Parallel(n_jobs=-1)(
            delayed(evaluate_question)(q) for q in questions
        )
        # Keep only the questions where Gemini returned YES.
        filtered_questions = [q for q in results if q is not None]
        filtered_entry[subject] = filtered_questions
    return filtered_entry

def main():
    # Read the input JSON from bank.json.
    with open("bank.json", "r") as infile:
        bank_data = json.load(infile)
    print("Loaded tests.")

    filtered_tests = []
    # Process each test sequentially.
    for test_entry in bank_data:
        filtered_entry = process_test_entry(test_entry)
        filtered_tests.append(filtered_entry)
        # Optionally, write out the partial result after each test.
        with open("bank_filtered.json", "w") as outfile:
            json.dump(filtered_tests, outfile, indent=2)

    print("Finished processing. Output written to bank_filtered.json.")

if __name__ == "__main__":
    main()

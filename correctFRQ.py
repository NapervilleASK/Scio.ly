import json
import google.generativeai as genai
import os
import time

# List of API Keys
API_KEYS = [
    "AIzaSyCfqBUffTO__rekXIKOU3g5gaWtNiXqUJE",
    "AIzaSyBd3NxLibgtZm9eVJtPN1l7TaKrFIfqsRw",
    "AIzaSyAiA-njA4SwlA6sI12VKJHnYBNdKDzM0yI",
    "AIzaSyA7tWKPs5TzSLGA9DJqKTjUyvCHs-zkRh4",
    "AIzaSyAjTo2gr-jQvXPMfd3wgSgF4GlI9xSd2ug",
    "AIzaSyAOP4QEzlMmiI2EMzSF-f8zCE2_3X8PMQI",
    "AIzaSyDir7-baCKB81J_gF4WudMSL1LoxUK_yV4",
]

def process_free_response_questions(filepath):
    """
    Reads a JSON file line by line, identifies free response questions,
    and uses a generative AI model to get answers, cycling through API keys.

    Args:
        filepath (str): The path to the JSON file.
    """
    try:
        with open(filepath, 'r') as f:
            for line in f:
                try:
                    data = json.loads(line.strip())
                    for category, questions in data.items():
                        print(f"\nProcessing questions for category: {category}")
                        for question_entry in questions:
                            if any("free response" in str(ans).lower() for ans in question_entry.get("answers", [])):
                                question_text = question_entry.get("question")
                                print(f"\nFound free response question: {question_text}")
                                for api_key in API_KEYS:
                                    try:
                                        genai.configure(api_key=api_key)
                                        model = genai.GenerativeModel("gemini-2.0-flash-exp")
                                        response = model.generate_content(f"Answer the following question: {question_text}")
                                        if response.parts:
                                            print("AI Generated Answer (using API Key starting with: ...{})".format(api_key[7:10]))
                                            print(response.text)
                                            break  # Move to the next question if successful
                                        else:
                                            print("AI did not generate an answer with this API key (starting with: ...{}). Trying next key.".format(api_key[7:10]))
                                    except Exception as e:
                                        print(f"Error generating answer with API key starting with: ...{api_key[7:10]}: {e}. Trying next key.")
                                    time.sleep(1) # Add a small delay to avoid hitting rate limits quickly
                                else:  # This else belongs to the for loop, executed if the loop finishes without break
                                    print("Failed to get an answer for this question with all available API keys.")
                except json.JSONDecodeError:
                    print(f"Skipping invalid JSON line: {line.strip()}")
    except FileNotFoundError:
        print(f"Error: File not found at {filepath}")

if __name__ == "__main__":
    filepath = "beta_bank.json"  # Replace with the actual path to your file
    process_free_response_questions(filepath)
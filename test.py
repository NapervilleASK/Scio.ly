import json
from google import genai
import time
GEMINI_API_KEY = []
# Initialize the Gemini client with your API key
# List of keys to process (we compare in lowercase)
keys_to_process = {
    "dynamic planet",
    "climate change",
    "glaciology",
    "air_quality",
    "plate tectonics",
    "oceans, climate, and climatographs",
    "ocean floor",
    "dynamic planet free response"
}

# The list of titles Gemini is allowed to return
allowed_titles = [
    "Dynamic Planet - Glaciers",
    "Dynamic Planet - Earthquakes, Volcanoes, and Tectonics",
    "Dynamic Planet - Earth's Fresh Waters",
    "Dynamic Planet - Oceanography",
    "Dynamic Planet - Tectonics"
]

# Input and output file paths
input_filename = "beta_bank.json"
output_filename = "bank2.json"

with open(input_filename, "r", encoding="utf-8") as infile, open(output_filename, "w", encoding="utf-8") as outfile:
    # Process each JSON object line-by-line
    index = -1
    for line in infile:
        index += 1
        line = line.strip()
        if not line:
            continue  # Skip empty lines

        # Load the JSON object from the current line
        try:
            data = json.loads(line)
        except json.JSONDecodeError as e:
            print(f"Error decoding line: {e}")
            continue

        # Iterate over a copy of the keys to avoid modifying the dict while iterating
        for key in list(data.keys()):
            # Check if the key matches one of our target keys (using case-insensitive matching)
            if key.lower() in keys_to_process:
                # Assume the value is an array of questions; adjust if needed
                questions_array = data[key]

                # Create a prompt that includes the questions array and the list of allowed titles.
                prompt = (
                    f"Given the following array of questions: {json.dumps(questions_array)}\n"
                    f"Please choose the most appropriate title from the following options:\n"
                    f"{', '.join(allowed_titles)}"
                    f"Only return the most appropriate title verbatim/exact, NOTHING ELSE IN YOUR RESPONSE"
                )

                try:
                    # Call Gemini to generate a title based on the prompt
                    time.sleep(0.3)
                    client = genai.Client(api_key=GEMINI_API_KEY[index % len(GEMINI_API_KEY)])
                    response = client.models.generate_content(model='gemini-1.5-flash', contents=prompt).text
                    new_title = response.strip()
                    # Optionally, ensure the response is one of the allowed titles.
                    if new_title not in allowed_titles:
                        print(f"Warning: Gemini returned an unexpected title '{new_title}'. Using original key.")
                        print(key)
                        if new_title == "Dynamic Planet - Volcanoes, Earthquakes, and Tectonics":
                            new_title = "Dynamic Planet - Earthquakes, Volcanoes, and Tectonics"
                        else:
                            new_title = key  # fallback to the original key if response is unexpected
                except Exception as e:
                    print(f"Error calling Gemini API for key '{key}': {e}")
                    new_title = key  # fallback to original key if API call fails

                # Rename the key: add new key with the same value then remove the old key.
                data[new_title] = data.pop(key)

        # Write the (possibly modified) JSON object to the output file, one per line.
        outfile.write(json.dumps(data) + "\n")

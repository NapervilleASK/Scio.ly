import json
from google import genai
import time
GEMINI_API_KEY = ["AIzaSyCeePYMH5HBSXUTveHl4bdmFO4ahBAE_DE","AIzaSyC5OKLpFadOMx0sbRT2_sZ_K7eIY2lXdTo","AIzaSyCqomCXXxkbHDxvDvIUiK9ZVgYo3_A37G0","AIzaSyDgsQMjAIZOSkJ2NviVynyRm4e5no-xso0","AIzaSyDPGNgvfwwLsblr3Pn_-sFlBVk32JkAqRg","AIzaSyAr2RYSw_BvjtHBFfemY_XMlKJt__SPkfk","AIzaSyCmxaRE45Su7KT0oGifWJZaV9p0zRaNUWU","AIzaSyAadf7tJuQoiE_BGoFUOyGcxEAeeCtBJIw","AIzaSyD6gVkOJaiU6okLIQfrpcknHHAcmqUTQSg","AIzaSyBm_QUZnny6jo92p1CkbPOMglV73hUBETQ","AIzaSyCkskTBQMpvckmcIm2bHVbl2kkM9TnTjCA","AIzaSyBsA_O9vjzhkWAmjyD0KzSFNP0cxB9Yu90", "AIzaSyA3_dpqOA67d0tiQ3ayCL69lr2UD3OkDV8", "AIzaSyDHGciTN4papPucYcVU50xMZxii_CeJImE", "AIzaSyDX_lsfZLPdy-ZJtwj6z6V03vUoHRIVNYU", "AIzaSyDfi2QkcMCh1JoQgxA70VeZjZONUWMhm4A", "AIzaSyACCMbTVB7yCGXFNktKbIXF_NiTEZVw698", "AIzaSyDhXgviXgz03pdZ7yPMUiRrlquuvOUcuYo", "AIzaSyDkWDMtwWYKNOs-xlqHD8j4ekWZx6ivqWY", "AIzaSyBLRJQoy4icrP3_fVPyP7Ri7W-yULvrU-A", "AIzaSyCcc1SPuC_MIMtbLL3Tm35jjtez9ob6d8s", "AIzaSyCUmZWb4pgY_b_4I9vyWf12dWB_ja3DZzo", "AIzaSyDkoP82SFpZxXdOAa3-gqI8AEjlzcsXwNM", "AIzaSyCmjfvRzpwyhJ5Jg7RrLIfVq_MK9wdoq-E", "AIzaSyAVWlHTbtoUpo5Io6DMCt38Ih4ncfbDiXo", "AIzaSyBnLq7fxkCumOOB473f7nsqo_CCqIcTGTQ", "AIzaSyAgB3MoY7L1ALdXmY2t2N89eqgPAQeeyss", "AIzaSyC8l9t_YNnzTuXsOEiuBkhC390lOw6mV9k", "AIzaSyA-GSUkZ7-wtHcbT81JHP31v1OaXPZ4to8", "AIzaSyCNKjY5WL2NtJJfAoI9OOAAIrXWGpmJYpI", "AIzaSyDU-wpPBOvBsAvrbe8uY99uLhOK-LQSRPE", "AIzaSyCugPr4zL53bCFqBVArY_gPjKcjQQpc1Xc", "AIzaSyBr8iiu1CaTb4ptl0yjNN3ltZ_o7qN12Gk", "AIzaSyAcP0Y4u8qzuz0SKipNSTvvX9WwPz7Jlb4"]
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

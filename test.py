import requests
import json

API_KEYS = [
]

GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

def test_gemini_api_key(api_key):
    """
    Tests a given API key against the Gemini API (gemini-pro model).

    Args:
        api_key: The API key string to test.

    Returns:
        tuple: (is_valid, message)
               is_valid: True if the key seems valid, False otherwise.
               message: A descriptive message about the test result.
    """

    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [{
            "parts": [{
                "text": "Write a short poem about cats."
            }]
        }]
    }
    params = {"key": api_key}

    try:
        response = requests.post(GEMINI_API_ENDPOINT, headers=headers, params=params, data=json.dumps(data))
        response.raise_for_status()

        response_json = response.json()

        if "candidates" in response_json: # Successful response should have 'candidates'
            return True, "Valid API key: Gemini Pro request successful."
        elif "error" in response_json:
            error_data = response_json["error"]
            error_message = error_data.get("message", "Unknown error message")
            error_status = error_data.get("status", "UNKNOWN_STATUS")
            return False, f"Invalid API key (Gemini API Error - {error_status}): {error_message}"
        else:
            return False, f"Unknown API response format: {json.dumps(response_json)}"


    except requests.exceptions.HTTPError as http_err:
        return False, f"HTTP Error: {http_err}. Status Code: {response.status_code}. Response: {response.text}"
    except requests.exceptions.RequestException as req_err:
        return False, f"Request Error: {req_err}"
    except json.JSONDecodeError as json_err:
        return False, f"JSON Decode Error: {json_err}. Response Text: {response.text}"
    except Exception as e:
        return False, f"An unexpected error occurred: {e}"


if __name__ == "__main__":
    print("Starting Gemini API key tests...\n")
    for api_key in API_KEYS:
        print(f"Testing API Key: {api_key}")
        is_valid, message = test_gemini_api_key(api_key)
        if is_valid:
            print(f"  Result: VALID")
        else:
            print(f"  Result: INVALID")
        print(f"  Message: {message[0:50]}\n")

    print("\nGemini API key tests finished.")
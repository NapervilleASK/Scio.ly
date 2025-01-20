import json
import os

def append_json_objects(failed_file, beta_bank_file):
    """
    Reads a JSON array from failed_file, extracts JSON objects,
    and appends them as separate lines to beta_bank_file.

    Args:
        failed_file: Path to the JSON file containing the array.
        beta_bank_file: Path to the file to append to.
    """
    try:
        with open(failed_file, 'r') as f:
            try:
                failed_data = json.load(f)
                if not isinstance(failed_data, list):
                  raise TypeError(f"{failed_file} does not contain a JSON array.")
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON in {failed_file}: {e}")
                return
            except TypeError as e:
                print(e)
                return

    except FileNotFoundError:
        print(f"Error: {failed_file} not found.")
        return

    # Check if beta_bank exists, create it if not
    if not os.path.exists(beta_bank_file):
        open(beta_bank_file, 'w').close() # creates empty file

    with open(beta_bank_file, 'a') as outfile:
        for item in failed_data:
            try:
                json.dump(item, outfile, ensure_ascii=False)  # ensure_ascii=False handles non-ASCII characters correctly
                outfile.write('\n')  # Add newline for separate lines
            except TypeError as e:
                print(f"Error dumping JSON object: {e}. Object: {item}")
            except Exception as e: # Catch other potential errors during dumping
                print(f"An unexpected error occurred during JSON dumping: {e}. Object: {item}")


if __name__ == "__main__":
    failed_filename = "bank.json"
    beta_bank_filename = "beta_bank.json"
    append_json_objects(failed_filename, beta_bank_filename)
    print(f"Finished appending from {failed_filename} to {beta_bank_filename}")

import json

def load_json(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    # Load all three JSON files.
    final_data = load_json('final.json')
    blacklist_data = load_json('blacklist.json')
    edited_data = load_json('edited.json')

    # Build a set of blacklisted questions.
    blacklisted_questions = set()
    for event, questions in blacklist_data.items():
        for q_str in questions:
            try:
                q_obj = json.loads(q_str)
                question_text = q_obj.get('question')
                if question_text:
                    blacklisted_questions.add(question_text)
            except json.JSONDecodeError:
                continue

    # Build a mapping from original question text to the edited question object.
    edited_mapping = {}
    for event, edits in edited_data.items():
        for edit in edits:
            try:
                original_obj = json.loads(edit['original'])
                edited_obj = json.loads(edit['edited'])
                question_text = original_obj.get('question')
                if question_text:
                    edited_mapping[question_text] = edited_obj
            except json.JSONDecodeError:
                continue

    # Process the final data: remove blacklisted questions and apply edits.
    new_data = {}
    # final_data is assumed to be a dict with event names as keys and lists of question objects as values.
    for event, questions in final_data.items():
        updated_questions = []
        for question in questions:
            q_text = question.get('question')
            # If question text is missing, skip it.
            if not q_text:
                continue
            # Remove blacklisted questions.
            if q_text in blacklisted_questions:
                continue
            # Replace with edited version if available.
            if q_text in edited_mapping:
                updated_questions.append(edited_mapping[q_text])
            else:
                updated_questions.append(question)
        # Only include event if there are questions left.
        if updated_questions:
            new_data[event] = updated_questions

    # Write the output to final2.json.
    with open('final2.json', 'w', encoding='utf-8') as f:
        json.dump(new_data, f)

if __name__ == '__main__':
    main()

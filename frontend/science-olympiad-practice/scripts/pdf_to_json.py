import fitz  # PyMuPDF
import json
import os
import re

# Define event categories and their events
EVENT_CATEGORIES = {
    "Life, Personal & Social Science": [
        "ANATOMY AND PHYSIOLOGY",
        "DISEASE DETECTIVES",
        "ECOLOGY",
        "ENTOMOLOGY",
        "MICROBE MISSION"
    ],
    "Earth and Space Science": [
        "ASTRONOMY",
        "DYNAMIC PLANET",
        "FOSSILS",
        "GEOLOGIC MAPPING"
    ],
    "Physical Science & Chemistry": [
        "AIR TRAJECTORY",
        "CHEM LAB",
        "FORENSICS",
        "MATERIALS SCIENCE",
        "OPTICS",
        "WIND POWER"
    ],
    "Technology & Engineering": [
        "ELECTRIC VEHICLE",
        "HELICOPTER",
        "ROBOT TOUR",
        "TOWER"
    ],
    "Inquiry & Nature of Science": [
        "BUNGEE DROP",
        "CODEBUSTERS",
        "EXPERIMENTAL DESIGN",
        "WRITE IT DO IT"
    ]
}

# Flatten event list for easier lookup
ALL_EVENTS = {event: category for category, events in EVENT_CATEGORIES.items() for event in events}

def clean_text(text):
    """Clean and normalize text."""
    text = ' '.join(text.split())
    # Remove excessive punctuation but keep necessary ones
    text = re.sub(r'\.{3,}', ' ', text)  # Replace ... with space
    text = re.sub(r'\s+', ' ', text)  # Normalize spaces
    return text.strip()

def get_event_category(event_name):
    """Get the category for a given event name."""
    event_name = event_name.upper()
    # Handle special cases and variations
    if "ANATOMY" in event_name:
        event_name = "ANATOMY AND PHYSIOLOGY"
    elif "CHEMISTRY" in event_name or "CHEM." in event_name:
        event_name = "CHEM LAB"
    elif "TRAJECTORY" in event_name:
        event_name = "AIR TRAJECTORY"
        
    return ALL_EVENTS.get(event_name)

def is_event_header(text):
    """Check if text is an event header."""
    # Clean and normalize the text
    text = text.upper().strip()
    
    # Skip some common false positives
    if text in ['WELCOME TO THE 2025 SCIENCE OLYMPIAD!', 'SCIENCE OLYMPIAD KITS AND RESOURCES AVAILABLE NOW!']:
        return False
        
    # Skip division headers and other common headers
    if any(text.startswith(prefix) for prefix in ['DIVISION', 'DIV.', 'GENERAL RULES', 'TABLE OF', 'CONTENTS']):
        return False
    
    # Check if it's in our known events list (with some flexibility)
    for known_event in ALL_EVENTS.keys():
        # Handle variations in event names
        if known_event in text or text in known_event:
            return True
            
    return False

def looks_like_section_header(text):
    """Check if text looks like a section header."""
    text = text.strip()
    
    # Skip if text is too long to be a header
    if len(text) > 100:
        return False
    
    # Common section headers in the rules
    if any(text.upper().startswith(header) for header in [
        'DESCRIPTION:',
        'EVENT PARAMETERS:',
        'CONSTRUCTION PARAMETERS:',
        'THE COMPETITION:',
        'SCORING:',
        'PENALTIES:',
        'TIEBREAKERS:'
    ]):
        return True
    
    # Numbered sections with specific formats
    if re.match(r'^[1-9][0-9]?\.[\s\w]', text):  # Matches "1. ", "2. ", etc.
        return True
        
    # Lettered subsections
    if re.match(r'^[a-z]\.[\s\w]', text):
        return True
        
    # Roman numeral sections
    if re.match(r'^[IVX]+\.[\s\w]', text):
        return True
        
    return False

def extract_pdf_content(pdf_path, output_folder):
    """
    Extract text from a PDF and organize it into event-specific sections.
    """
    document = {'categories': {category: {'name': category, 'events': []} for category in EVENT_CATEGORIES.keys()}}
    pdf_document = fitz.open(pdf_path)
    current_event = None
    current_section = None
    section_counter = 0
    buffer = []
    
    for page_num in range(len(pdf_document)):
        page = pdf_document[page_num]
        blocks = page.get_text("blocks")  # Get text in reading order
        
        for block in blocks:
            text = clean_text(block[4])
            if not text:
                continue
                
            # Check for page numbers and skip them
            if re.match(r'^\d+$', text):
                continue
                
            # Check for event header
            if is_event_header(text):
                # Save previous event if exists
                if current_event and current_event['rules']:
                    category = current_event['category']
                    document['categories'][category]['events'].append(current_event)
                
                # Clean up event name
                event_name = re.sub(r'\s+', ' ', text).strip()
                event_id = re.sub(r'[^a-zA-Z0-9]+', '-', event_name.lower()).strip('-')
                category = get_event_category(event_name)
                
                if category:  # Only create event if we know its category
                    current_event = {
                        'id': event_id,
                        'name': event_name,
                        'category': category,
                        'description': '',
                        'rules': []
                    }
                    current_section = None
                    section_counter = 0
                    buffer = []
                continue
            
            # Check for section headers
            if looks_like_section_header(text):
                # Save buffered content to previous section
                if buffer and current_section:
                    current_section['content'].extend(buffer)
                    buffer = []
                
                section_counter += 1
                section_title = text.rstrip(':')
                # Create unique section ID using event name and counter
                section_id = f"{current_event['id'] if current_event else 'unknown'}-section-{section_counter}"
                
                current_section = {
                    'id': section_id,
                    'title': section_title,
                    'content': []
                }
                
                if current_event:
                    current_event['rules'].append(current_section)
                continue
            
            # Handle content
            if current_event:
                if not current_section:
                    if not current_event['description']:
                        current_event['description'] = text
                else:
                    # Skip headers that might have slipped through
                    if not looks_like_section_header(text):
                        # Clean up the content text
                        cleaned_text = text.strip()
                        if cleaned_text and not cleaned_text.isdigit():  # Skip pure numbers
                            buffer.append(cleaned_text)
    
    # Don't forget to add the last event
    if current_event and current_event['rules']:
        # Add any remaining buffered content
        if buffer and current_section:
            current_section['content'].extend(buffer)
        category = current_event['category']
        document['categories'][category]['events'].append(current_event)
    
    pdf_document.close()
    
    # Remove empty categories and clean up content
    document['categories'] = {k: v for k, v in document['categories'].items() if v['events']}
    
    # Save JSON
    json_path = os.path.join(output_folder, 'rules_content.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(document, f, indent=2, ensure_ascii=False)
    
    return json_path

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(current_dir, '..')
    public_dir = os.path.join(frontend_dir, 'public', 'rules')
    
    os.makedirs(public_dir, exist_ok=True)
    pdf_path = os.path.join(frontend_dir, 'public', 'scioly-rules.pdf')
    
    try:
        json_path = extract_pdf_content(pdf_path, public_dir)
        print(f"Successfully extracted content to {json_path}")
    except Exception as e:
        print(f"Error processing PDF: {str(e)}") 
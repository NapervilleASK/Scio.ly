from PyPDF2 import PdfReader

def pdf_to_text(pdf_path):
    # Create a PDF reader object
    reader = PdfReader(pdf_path)
    
    # Get total number of pages
    text = ""
    
    # Extract text from each page
    for page in reader.pages:
        text += page.extract_text()
    
    return text

if __name__ == "__main__":
    # Example usage
    pdf_path = "anap_test.pdf"  # Replace with your PDF file path
    extracted_text = pdf_to_text(pdf_path)
    print(extracted_text)
import re

try:
	with open("input.txt", 'r') as f:
		print(re.findall(r"https://drive\.google\.com/drive/folders/([^\"?\s]+)", f.read()))
except FileNotFoundError:
	print(f"Error: File '{filepath}' not found.")
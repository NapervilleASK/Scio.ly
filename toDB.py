import json
import os
titles = {
    'geology': 'Geologic Mapping',
    'digestive': 'Anatomy - Digestive',
    'tsa': 'Fun',
    'outbreak investigation': 'Disease Detectives',
    'human_impact': 'Human Impact on Environment',
    'ping pong parachute': 'Ping Pong Parachute',
    'mission possible': 'Mission Possible',
    "it's about time": "It's About Time",
    'cardiovascular': 'Anatomy - Cardiovascular',
    'geologic mapping': 'Geologic Mapping',
    'anatomy_respiratory': 'Anatomy - Respiratory',
    'environmental_chemistry': 'Environmental Chemistry',
    'genetics': 'Designer Genes',
    'fermi questions': 'Fermi Questions',
    'anatomy - immune': 'Anatomy - Immune',
    'anatomy - lymphatic': 'Anatomy - Lymphatic',
    'energy': 'Ecology',  # Mapped to Ecology
    'anatomy_endocrine': 'Anatomy - Endocrine',
    'anatomy - excretory - free response': 'Anatomy - Excretory',
    'anatomy - digestive': 'Anatomy - Digestive',
    'environmental science': 'Environmental Chemistry',  # Mapped to Ecology
    'experimental design': 'Experimental Design',
    'topographic map': "Road Scholar", 
    'disease detectives': 'Disease Detectives',
    'roller coaster': "Roller Coaster", 
    'anatomy-respiratory': 'Anatomy - Respiratory',
    'mousetrap vehicle': 'Mousetrap Vehicle',
    'immune': 'Anatomy - Immune',
    'waste': 'Ecology',  # Mapped to Ecology
    'dynamic planet': 'Dynamic Planet',
    'machines': 'Machines',
    'lymphatic': 'Anatomy - Lymphatic',
    'astronomy': 'Astronomy',
    'anatomy - excretory and cardiovascular': "Anatomy - Excretory", 
    'integration bee': "Fun", 
    'botany': 'Plant Biology',
    'epidemiology': "Disease Detectives", 
    'helicopter': 'Helicopter',
    'wifi lab': 'WiFi Lab',
    'anatomy - blood': 'Anatomy - Cardiovascular', 
    'cell biology': 'Cell Biology',
    'biochemistry': 'Cell Biology',  # Mapped to Cell Biology
    'data_analysis': 'Data Science',  # Mapped to Data Science
    'bridge building': 'Bridge Building',
    'bridge': 'Bridge',
    'designer_genes': 'Designer Genes',
    'circuit_lab': 'Circuit Lab',
    'water quality': 'Water Quality',
    'neurotransmitters': 'Cell Biology',  # Mapped to Cell Biology
    'anatomy - sense organs': 'Anatomy - Sense Organs',
    'ornithology': 'Ornithology',
    'game on': 'Game On',
    'scrambler': 'Scrambler',
    'compound machines': 'Compound Machines',
    'disease_detectives': 'Disease Detectives',
    'anatomy - endocrine': 'Anatomy - Endocrine',
    'fermi_questions': 'Fermi Questions',
    'anime': "Fun", 
    'herpetology': 'Herpetology',
    'road scholar': "Road Scholar", 
    'metabolism': "Cell Biology", 
    'respiratory': 'Anatomy - Respiratory',
    'psychology terms': "Neuroscience", 
    'anatomy_digestive': 'Anatomy - Digestive',
    'green generation': 'Green Generation',
    'anatomy_muscular': 'Anatomy - Muscular',
    'earth science': "Dynamic Planet", 
    'physics terms': "Physics Lab", 
    'bungee drop': 'Bungee Drop',
    'protein modeling': 'Protein Modeling',
    'anatomy_immune': 'Anatomy - Immune',
    'anatomy - integumentary': 'Anatomy - Integumentary',
    'wright stuff': 'Wright Stuff',
    'anatomy_nervous': 'Anatomy - Nervous',
    'chemistry_lab': 'Chemistry Lab',
    'trajectory': 'Trajectory',
    'stratigraphy': "Geologic Mapping", 
    'sounds of music': 'Sounds of Music',
    'tcg': "Fun", 
    'regression': "Detector Building", 
    'circuits': "Detector Building", 
    'crime busters': 'Crime Busters',  # Mapped to Crime Busters
    'codebusters': 'Codebusters',
    'plant biology': 'Plant Biology',
    'hovercraft': 'Hovercraft',
    'boomilever': 'Boomilever',
    'excretory': 'Anatomy - Excretory',
    'experimental_design': 'Experimental Design',
    'anatomy - cardiovascular': 'Anatomy - Cardiovascular',
    'write it do it': 'Write It Do It',
    'engineering': "Detector Building", 
    'anatomy - excretory': 'Anatomy - Excretory',
    'tower': 'Tower',
    'climate': "Dynamic Planet", 
    'solutions to negative human impact on environment': "Green Generation", 
    'psychoactive drugs': "Interrogating the Brain", 
    'wind_power': 'Wind Power',
    'psychology': "Neuroscience", 
    'general physics': "Physics Lab", 
    'limnology': 'Ecology',  # Mapped to Ecology (Hydrology is a subfield of Hydrology)
    'hydrology': 'Ecology',  # Mapped to Ecology
    'remote sensing': 'Remote Sensing',
    'human impact on environment': 'Human Impact on Environment',
    'forestry': 'Forestry',
    'thermodynamics': 'Thermodynamics',
    'optics': 'Optics',
    'sedimentary features': "Rocks and Minerals", 
    'anatomy-nervous': 'Anatomy - Nervous',
    'waves': "Crave the Wave", 
    'vgc': "Fun", 
    'flight': 'Flight',
    'terrestrial_ecosystems': 'Ecology',  # Mapped to Ecology
    'rocks and minerals free response': 'Rocks and Minerals',
    'forensics': 'Forensics',
    'designer genes': 'Designer Genes',
    'dynamic_planet': 'Dynamic Planet',
    'chemistry lab': 'Chemistry Lab',
    'fingerprinting': "Forensics", 
    'anatomy - respiratory': 'Anatomy - Respiratory',
    'chemistry': 'Chemistry Lab',  # Mapped to Chemistry Lab
    'statistics': "Data Science", 
    'anatomy - muscular': 'Anatomy - Muscular',
    'nutrition': "Food Science", 
    'rocks and minerals': 'Rocks and Minerals',
    'meteorology': "Meteorology", 
    'structural geology': "Geologic Mapping", 
    'random': "Fun", 
    'environmental chemistry': 'Environmental Chemistry',
    'general meteorology': "Meteorology", 
    'paleontology': 'Fossils',
    'electric vehicle': 'Electric Vehicle',
    'plant_biology': 'Plant Biology',
    'physics': "Physics Lab", 
    'cybersecurity': 'Cybersecurity',  # Mapped to Cybersecurity
    'fossils': 'Fossils',
    'technical problem solving': 'Technical Problem Solving',
    'molecular_biology': "Cell Biology", 
    'random knowledge': "Fun", 
    'anatomy - skeletal': 'Anatomy - Skeletal',
    'entomology': 'Entomology',
    'cell_biology': 'Cell Biology',
    'materials science': 'Materials Science',
    'anatomy - general': "Anatomy - Muscular ", 
    'detector building': 'Detector Building',
    'robot arm': 'Robot Arm',
    'public health': 'Disease Detectives',  # Mapped to Disease Detectives
    'wind power': 'Wind Power',
    'invasive species': 'Invasive Species',
    'microbe mission': 'Microbe Mission',
    'pokemon trivia': "Fun", 
    'circuit lab': 'Circuit Lab',
    'ecology': 'Ecology',
    'anatomy - nervous': 'Anatomy - Nervous',
    'ecology_biome': 'Ecology',  # Mapped to Ecology
    'gravity vehicle': 'Gravity Vehicle',
    # Now map events to themselves
    "bungee drop": "Bungee Drop",
    "cell biology": "Cell Biology",
    "chemistry lab": "Chemistry Lab",
    "circuit lab": "Circuit Lab",
    "codebusters": "Codebusters",
    "compound machines": "Compound Machines",
    "designer genes": "Designer Genes",
    "detector building": "Detector Building",
    "disease detectives": "Disease Detectives",
    "dynamic planet": "Dynamic Planet",
    "ecology": "Ecology",
    "electric vehicle": "Electric Vehicle",
    "entomology": "Entomology",
    "environmental chemistry": "Environmental Chemistry",
    "experimental design": "Experimental Design",
    "fermi questions": "Fermi Questions",
    "flight": "Flight",
    "forensics": "Forensics",
    "forestry": "Forestry",
    "fossils": "Fossils",
    "game on": "Game On",
    "geologic mapping": "Geologic Mapping",
    "gravity vehicle": "Gravity Vehicle",
    "green generation": "Green Generation",
    "helicopter": "Helicopter",
    "herpetology": "Herpetology",
    "hovercraft": "Hovercraft",
    "invasive species": "Invasive Species",
    "it's about time": "It's About Time",
    "machines": "Machines",
    "materials science": "Materials Science",
    "microbe mission": "Microbe Mission",
    "mission possible": "Mission Possible",
    "mousetrap vehicle": "Mousetrap Vehicle",
    "optics": "Optics",
    "ornithology": "Ornithology",
    "ping pong parachute": "Ping Pong Parachute",
    "protein modeling": "Protein Modeling",
    "remote sensing": "Remote Sensing",
    "robot arm": "Robot Arm",
    "rocks and minerals": "Rocks and Minerals",
    "scrambler": "Scrambler",
    "sounds of music": "Sounds of Music",
    "technical problem solving": "Technical Problem Solving",
    "thermodynamics": "Thermodynamics",
    "tower": "Tower",
    "trajectory": "Trajectory",
    "water quality": "Water Quality",
    "wifi lab": "WiFi Lab",
    "wind power": "Wind Power",
    "wright stuff": "Wright Stuff",
    "write it do it": "Write It Do It",
    "renewable energies": "Wind Power",  # Closest related event
    "energy conservation and recycling": "Green Generation", # Closest related event
    "water_quality": "Water Quality",
    "population_dynamics": "Ecology", # or possibly Dynamic Planet if focusing on changing populations over time
    "biogeochemical_cycles": "Environmental Chemistry", # or potentially Dynamic Planet or Ecology
    "sustainability": "Green Generation",
    "community_interactions": "Ecology",
    "legislation": "Green Generation", # Unrelated to listed events
    "noise_pollution": "Sounds of Music", # loosely related as a type of sound
    "food science": "Agricultural Science",
    "data science": "Data Science",
    "sounds of music free response": "Sounds of Music",
    "anatomy-skeletal": "Anatomy - Skeletal", # Broadly related to biology
    "aquatic ecosystems": "Ecology",
    "community interactions": "Ecology",
    "nutrient cycles": "Ecology", # Related to chemical processes in the environment
    "human impacts": "Environmental Chemistry", # Or potentially Ecology
    "air quality": "Environmental Chemistry",
    "climate change": "Dynamic Planet", # Most directly related
    "sustainability": "Green Generation",
    "pollution prevention": "Environmental Chemistry", # Or Green Generation
    "plant science": "Plant Biology", # or potentially Forestry
    "anatomy - cellular": "Cell Biology",
    "anatomy - genetics": "Designer Genes",
    "nervous": "Anatomy - Nervous", # Broadly related to biology
    "sense_organs": "Anatomy - Sense Organs", # Broadly related to biology
    "endocrine": "Anatomy - Endocrine", # Broadly related to biology
    "machine learning": "Data Science",
    "general_ecology": "Ecology",
    "solutions_human_impact": "Green Generation", # Or Environmental Chemistry
    "bioinformatics": "Designer Genes", # Related to genetic information and analysis
    "green_generation": "Green Generation",
    'enzymes': "Cell Biology",
    'anatomy_skeletal': 'Anatomy - Skeletal',
    'anatomy_integumentary': 'Anatomy - Integumentary',
    'scientific_method': 'Experimental Design',
    'linguistics': 'Codebusters',
    'geophysics': 'Geologic Mapping',
    'glaciology': "Dynamic Planet",
    'microscopy': "Microbe Mission",
    'tools and analysis': "Chemistry Lab",
    'geologic_mapping': 'Geologic Mapping',
    'remote_sensing': 'Remote Sensing',
    'taxonomy': 'Ornithology',
    'anatomy_sense_organs': 'Anatomy - Sense Organs',
    'aquatic': "Water Quality",
    'air_quality': 'Dynamic Planet',
    'climate_change': 'Ecology',
    'sustainability_strategies': 'Ecology',
    'horticulture': 'Plant Biology',
    'home horticulture': 'Plant Biology',
    'disease': 'Disease Detectives',
    'aquatic environments': "Water Quality",
    'aquatic environmental issues': "Water Quality",
    'air quality issues': 'Ecology',
    'sustainability strategies': 'Ecology',
    'agribio': "Agricultural Science",
    'machines_free_response': 'Machines',
    'anatomy - joints': "Anatomy - Skeletal",
    'experiment_and_data_analysis': 'Experimental Design',
    'heredity': 'Designer Genes',
    'density lab': "Chemistry Lab",
    'pedigree and karyotypes': 'Designer Genes',
    'cell cycle and chromosomes': 'Cell Biology',
    'molecular genetics': 'Designer Genes',
    'data analysis': 'Data Science',
    'data and experimental interpretation': 'Experimental Design',
    'anatomy-integumentary': 'Anatomy - Integumentary',
    'anatomy-muscular': 'Anatomy - Muscular',
    'general knowledge': "Fun",
    'protein_modeling': 'Protein Modeling',
    'physics lab': 'Physics Lab',
    'fun': 'Fun',
    'helicopters': 'Helicopter',
    'microbe_mission': 'Microbe Mission',
    'materials_science': 'Materials Science',
    'anatomy_cardiovascular': 'Anatomy - Cardiovascular',
    'integumentary system': 'Anatomy - Integumentary',
    'muscular system': 'Anatomy - Muscular',
    'skeletal system': 'Anatomy - Skeletal',
    'air trajectory': 'Trajectory',
    'crispr-cas systems': 'Protein Modeling',
    'protein modeling and crispr-cas systems': 'Protein Modeling',
    'remote sensing and climate change': 'Remote Sensing',
    'remote sensing and the atmosphere': 'Remote Sensing',
    'plate tectonics': 'Dynamic Planet',
    'pathophysiology': 'Disease Detectives',
    'aviation': 'Flight',
    'robot tour': 'Robot Arm',
    'satellite image analysis': 'Remote Sensing',
    'math': 'Fermi Questions',
    'deep sky objects': 'Astronomy',
    'anatomy - genetic': 'Designer Genes',
    'taphonomy': 'Fossils',
    'case studies': 'Forensics',
    'general principles of ecology': 'Ecology',
    'oceans, climate, and climatographs': 'Dynamic Planet',
    'earth_science': 'Geologic Mapping',
    'vegetation, soil, and drought': 'Forestry',
    'paleobotany': 'Fossils',
    'physical science': 'Chemistry Lab',
    'algorithm analysis': 'Codebusters',
    'web architecture': 'Cybersecurity',
    'metric mastery': 'Technical Problem Solving',
    'scribble pictionary': 'Write It Do It',
    'mycology': 'Microbe Mission',
    'extraordinary enso': 'Meteorology',
    'earth structure': 'Rocks and Minerals',
    'ocean floor': 'Dynamic Planet',
    'physical properties': 'Materials Science',
    'anatomy - physiology': 'Anatomy - Cardiovascular',
    'anatomy - disease': 'Disease Detectives',
    'potions and poisons': 'Chemistry Lab',
    'potions & poisons': 'Chemistry Lab',
    'road maps': 'Road Scholar',
    'materials science graph': 'Materials Science',
    'materials science short answer': 'Materials Science',
    'materials science matching': 'Materials Science',
    'circuit lab free response': 'Circuit Lab',
    'anatomy - respiratory matching': 'Anatomy - Respiratory',
    'anatomy - respiratory matching2': 'Anatomy - Respiratory',
    'anatomy - sense organs conditions': 'Anatomy - Sense Organs',
    'skeletal': 'Anatomy - Skeletal',
    'muscular': 'Anatomy - Muscular',
    'integumentary': 'Anatomy - Integumentary',
    'ecology_conservation': 'Ecology',
    "earth's energy budget and modeling": 'Meteorology',
    'robot arm': 'Robot Arm',
    'dna/rna structure and crispr-cas systems': 'Protein Modeling',
    'pre-debut photos': 'Fun',                   # Creative/fun-themed event
    'memeable moments': 'Fun',                   # Humor or informal competition
    'astrophysics': 'Astronomy',                 # Astrophysics is a subtopic of Astronomy
    'general trivia': 'Fermi Questions',         # Estimation/trivia-based event
    'world records': 'Fermi Questions',          # Focused on extreme numerical guesses
    'completion': 'Experimental Design',         # Involves completing structured tasks
    'biophysics': 'Protein Modeling',            # Molecular biology overlaps with biophysics
    'climate in texas': 'Meteorology',           # Study of weather/climate
    'brainrot battle': 'Fun',                    # Informal/silly competition
    'general biology': 'Cell Biology',                # Broad ecological systems focus
    'material science': 'Materials Science',     # Direct synonym (singular vs. plural)
}
print("All values:", [*set([f for f in titles.values() if f is not None])])
# os.exit()
def combine_bank_data(filename="bank.txt"):
    """
    Combines JSON objects from a file, extending arrays for same keys
    and filtering out objects with empty 'answers' arrays.

    Args:
        filename (str): The name of the file containing JSON objects.

    Returns:
        dict: A single dictionary containing the combined JSON data.
    """
    combined_data = {}
    bruh = set()
    with open(filename, 'r') as f:
        for line in f:
            try:
                data = json.loads(line.strip())
                for key, value in data.items():
                    key = key.lower()
                    # bruh.add(key)
                    if key not in titles:
                        bruh.add(key)
                        continue
                    key = titles[key]
                    if key is None:
                        # print("Skipping key")
                        continue
                    if key in combined_data:
                        # Extend the existing list with new items, filtering as needed
                        combined_data[key].extend([
                            item
                            for item in value
                            if item.get('answers') and len(item['answers']) > 0 and item.get("question")
                            and len(item['question']) > 8
                            and not (len(item['question']) < 85 and "this star" in item['question'])
                            and not any(phrase in item['question'].lower() for phrase in [
                                "this picture", "this image", "this diagram", "this map",
                                "image a", "image b", "image c", "image 1", "image 2", "image 3",
                                "the image", "in figure", "pictured above", "pictured below",
                                "figure a", "figure b", "figure c", "following table", "table above",
                                "this specimen", "identify this", "this organism", "the photo below",
                                "given information", "the table", "the structures labeled", "specimen a",
                                "specimen b", "specimen c", "specimen d", "specimen e", "specimen g"
                                "specimen f", "below data", "this bird", "this animal", "this habitat", 
                                "specimen 1", "specimen 2", "specimen 3", "specimen 4", "specimen 5",
                                "specimen 6", "specimen 7", "specimen 8", "specimen 9", "specimen 10",
                                "this individual", "Identify #", "diagram below", "the diagram", 
                                "slide above", "depicted in image", "image 1", "image 2", "image 3",
                                "image 4", "image 5", "image 6", "image 7", "image 8", "image 9", 
                                "picture below", "the picture", "shown above", "shown below", "point a",
                                "point b", "point c", "Question 1", "question 2", "question 3",
                                "question 4", "question 5", "question 6", "question 7", "question 8",
                                "question 9", "question #", "specimen h", "specimen i", "specimen j",
                                "specimen k", "specimen l", "specimen m", "specimen n", "specimen o",
                                "specimen p", "specimen q" "specimen r" , "specimen s", "specimen t"
                                "specimen u", "specimen v", "speciemn w", "specimen x", "specimen y", "specimen z", 
                                "indicated by", "diagram to the right", "this device", "this bacteria",
                                "letter a ", "letter b ", "letter c ", "letter d ", "letter e ", "letter f ",
                                "letter g ", "letter h ", "letter i ", "letter j ", "these specimens", "multiple choice",
                                "shown to the right", "identify powder", "(left)", "(right)", "graph above",
                                "#1","#2","#3","#4","#5","#6","#7","#8","#9", "the reading on"
                            ])
                        ])
                    else:
                        # Create a new list, filtering as needed
                        combined_data[key] = [item for item in value if item.get('answers') and len(item['answers']) > 0]
            except json.JSONDecodeError:
                print(f"Skipping invalid JSON line: {line.strip()}")
    print("Unknown keys: ", bruh)
    return combined_data

# Combine the data from bank.txt
combined_bank = combine_bank_data()

# Write the combined JSON object to bank_filtered.json
with open("bank_filtered.json", 'w') as outfile:
    json.dump(combined_bank, outfile, indent=2)

<<<<<<< HEAD
print("Combined and filtered data written to bank_filtered.json")
=======
print("Combined and filtered data written to bank_filtered.json")
>>>>>>> 67812faf785eb6bb1fe35a20e019fb91ef96a974

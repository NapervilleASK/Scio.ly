import json
import os
import regex as re
titles = {
    'geology': 'Geologic Mapping',
    'digestive': 'Anatomy - Digestive',
    'tsa': 'Fun',
    'outbreak investigation': 'Disease Detectives',
    'human_impact': 'Human Impact on Environment',
    'ping pong parachute': 'Ping Pong Parachute',
    "Mission Possible": "Mission Possible",
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
    'machines': 'Machines',
    'lymphatic': 'Anatomy - Lymphatic',
    'astronomy': 'Astronomy',
    'anatomy - excretory and cardiovascular': "Anatomy - Excretory", 
    'integration bee': "Fun", 
    'botany': 'Plant Biology',
    'epidemiology': "Disease Detectives", 
    'helicopter': 'Fun',
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
    'write it do it': 'Fun',
    'engineering': "Detector Building", 
    'anatomy - excretory': 'Anatomy - Excretory',
    'tower': 'Tower',
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
    'anatomy - general': "Anatomy - Muscular", 
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
    "helicopter": "Fun",
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
    "write it do it": "Fun",
    "renewable energies": "Wind Power",  # Closest related event
    "energy conservation and recycling": "Green Generation", # Closest related event
    "water_quality": "Water Quality",
    "population_dynamics": "Ecology", # or possibly Dynamic Planet if focusing on changing populations over time
    "biogeochemical_cycles": "Environmental Chemistry", # or potentially Dynamic Planet or Ecology
    "dynamic planet - glaciers": "Dynamic Planet - Glaciers",
    "dynamic planet - earthquakes, volcanoes, and tectonics": "Dynamic Planet - Earthquakes, Volcanoes, and Tectonics",
    "dynamic planet - earth's fresh waters": "Dynamic Planet - Earth's Fresh Waters",
    "dynamic planet - oceanography": "Dynamic Planet - Oceanography",
    "dynamic planet - tectonics": "Dynamic Planet - Tectonics",
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
    'microscopy': "Microbe Mission",
    'tools and analysis': "Chemistry Lab",
    'geologic_mapping': 'Geologic Mapping',
    'remote_sensing': 'Remote Sensing',
    'taxonomy': 'Ornithology',
    'anatomy_sense_organs': 'Anatomy - Sense Organs',
    'aquatic': "Water Quality",
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
    'helicopters': 'Fun',
    'microbe_mission': 'Microbe Mission',
    'materials_science': 'Materials Science',
    'anatomy_cardiovascular': 'Anatomy - Cardiovascular',
    'integumentary system': 'Anatomy - Integumentary',
    'muscular system': 'Anatomy - Muscular',
    'Anatomy - Muscular ': 'Anatomy - Muscular',
    'skeletal system': 'Anatomy - Skeletal',
    'air trajectory': 'Trajectory',
    'crispr-cas systems': 'Protein Modeling',
    'protein modeling and crispr-cas systems': 'Protein Modeling',
    'remote sensing and climate change': 'Remote Sensing',
    'remote sensing and the atmosphere': 'Remote Sensing',
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
    'earth_science': 'Geologic Mapping',
    'vegetation, soil, and drought': 'Forestry',
    'paleobotany': 'Fossils',
    'physical science': 'Chemistry Lab',
    'algorithm analysis': 'Codebusters',
    'web architecture': 'Cybersecurity',
    'metric mastery': 'Technical Problem Solving',
    'scribble pictionary': 'Fun',
    'mycology': 'Microbe Mission',
    'extraordinary enso': 'Meteorology',
    'earth structure': 'Rocks and Minerals',
    'physical properties': 'Materials Science',
    'anatomy - physiology': 'Anatomy - Cardiovascular',
    'anatomy - disease': 'Disease Detectives',
    'potions and poisons': 'Potions and Poisons',
    'potions & poisons': 'Potions and Poisons',
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
    'material science': 'Materials Science',     # Direct synonym (singular vs. plural),
    'Fun': 'Fun',
    'game theory': None,
    'ichthyology': None,
    'geowizard': None,
    'computer science': None,
    '3d printing': None,
    'picture this': None,
    'science word': None,
    'ecology free response': "Ecology",
    "anagrams": None,
    "crimebusters": "Crime Busters",
    "geoguessr": None,
    "toxicology": None,
    "general toxicology": None,
    'anatomy': 'Anatomy - Cardiovascular',
    'torque': 'Machines',
    'polymer chemistry': 'Materials Science',
    'instructions': None,
    'nervous system': 'Anatomy - Nervous',
    'solutions': 'Chemistry Lab',
    'immune system': 'Anatomy - Immune',
    'genetic technologies': 'Designer Genes',
    'disease dynamics': 'Disease Detectives',
    'anatomy - cardiovascular & lymphatic': 'Anatomy - Cardiovascular',
    'lean mean meme machine': 'Fun',
    'troll facts': 'Game On',
    'population genetics and phylogeny': 'Designer Genes',
    'brainrot': 'Interrogating the Brain',
    'difficulty': 'Technical Problem Solving',
    'general science': None,
    'respiratory system': 'Anatomy - Respiratory',
    'free response': None,
    'science': None,
    'sense organs - eye conditions': 'Anatomy - Sense Organs',
    'game knowledge': 'Game On',
    'anatomy - biochemistry': 'Cell Biology',
    'leguminosae': 'Plant Biology',
    'minerals': 'Rocks and Minerals',
    'soil': 'Geologic Mapping',
    'dog breeds': None,
    'biology': 'Cell Biology',
    'write it do it c': 'Fun',
    'general lab safety': 'Chemistry Lab',
    'anatomy - digestive - histology': 'Anatomy - Digestive',
    'digital structures': 'Machines',
    'terrestrial environmental issues': 'Human Impact on Environment',
    'economic impact': None,
    'particle physics': 'Physics Lab',
    'microbial genetics': 'Microbe Mission',
    'renewable energy': 'Wind Power',
    'dinosaurs': 'Fossils',
    'calculus': 'Technical Problem Solving',
    'computer hardware': 'Robot Arm',
    'science fields': None,
    'general questions': None,
    'environmental toxins': 'Environmental Chemistry',
    'brawl stars': 'Game On',
    'free response questions': None,
    'meteorology b': 'Meteorology',
    'viruses & viroids': 'Disease Detectives',
    'digestive system': 'Anatomy - Digestive',
    'coral reefs': 'Ecology',
    'microbial metabolism': 'Microbe Mission',
    'multiple events': None,
    'prokaryotic genetic analysis': 'Designer Genes',
    'mathematics': 'Technical Problem Solving',
    'anatomy - organs': 'Anatomy - Digestive',
    'circulatory': 'Anatomy - Cardiovascular',
    'cryptanalysis': 'Codebusters',
    'topography': 'Geologic Mapping',
    'study design': 'Experimental Design',
    'fast facts': None,
    'community interactions and diversity': 'Ecology',
    'famous scientists': None,
    'physiological integration': 'Anatomy - Muscular',
    'physics - particle': 'Physics Lab',
    'python and general programming': 'Technical Problem Solving',
    'machine intelligence': 'Data Science',
    'culture & growth': 'Plant Biology',
    'clash royale': 'Fun',
    'orgo olympics': 'Chemistry Lab',
    'endocrine system': 'Anatomy - Endocrine',
    'sense organs': 'Anatomy - Sense Organs',
    'lab equipment': 'Chemistry Lab',
    'structure & morphology': 'Anatomy - Skeletal',
    'biomes': 'Ecology',
    'anatomy - digestive - true/false': 'Anatomy - Digestive',
    'physics - quantum': 'Physics Lab',
    'physics - general': 'Physics Lab',
    'cellular and molecular biology': 'Cell Biology',
    'statistical methods': 'Data Science',
    'microbial reproduction & extremophiles': 'Microbe Mission',
    'forests and grasslands': 'Forestry',
    'microbial interactions': 'Microbe Mission',
    'experiment & data analysis': 'Experimental Design',
    'chromatography': 'Chemistry Lab',
    'herbarium samples': 'Plant Biology',
    'physicists': 'Physics Lab',
    'deserts and tundra': 'Ecology',
    'anatomy - digestive true/false': 'Anatomy - Digestive',
    'proteins': 'Protein Modeling',
    'event': None,
    'polymer testing': 'Materials Science',
    'crave the wave': 'Crave the Wave',
    'animal biology': 'Cell Biology',
    'constellations': 'Astronomy',
    'technology': None,
    'bacterial physiology': 'Microbe Mission',
    'satellite photos/internet maps': 'Remote Sensing',
    'metabolism & application': 'Cell Biology',
    'solar power': 'Green Generation',
    'fields of science': None,
    'robotics': 'Robot Arm',
    'aerodynamics': 'Flight',
    'integrative': 'Anatomy - Muscular',
    'plants': 'Plant Biology',
    'antennas': 'Circuit Lab',
    'anatomy - sensory receptors': 'Anatomy - Sense Organs',
    'microscopes': 'Cell Biology',
    'music theory': 'Sounds of Music',
    'flowers and fruits': 'Plant Biology',
    'meta': None,
    'anatomy - integrative': 'Anatomy - Muscular',
    'anatomy - cardiovascular/lymphatic/excretory': 'Anatomy - Cardiovascular',
    'transition metals': 'Chemistry Lab',
    'amphibians': 'Herpetology',
    'environmental engineering': 'Human Impact on Environment',
    'anatomy - cell biology': 'Cell Biology',
    'scientific tools': 'Technical Problem Solving',
    'bark': 'Forestry',
    'electromagnetism': 'Physics Lab',
    'ecology - symbiosis': 'Ecology',
    'bio process lab': 'Food Science',
    'mammals': 'Cell Biology',
    'anatomy - respiratory true/false': 'Anatomy - Respiratory',
    'basic discrete math': 'Technical Problem Solving',
    'molecular biology': 'Cell Biology',
    'number theory': 'Technical Problem Solving',
    'answers': None,
    'eukaryotic genetic analysis': 'Designer Genes',
    'population dynamics': 'Ecology',
    'pedigrees and karyotypes': 'Designer Genes',
    'anatomy - all systems': 'Anatomy - Cardiovascular',
    'tournament tycoon': 'Game On',
    'amino acids': 'Protein Modeling',
    'general energy': 'Thermodynamics',
    'periodic table elements': 'Chemistry Lab',
    'subatomic particles': 'Physics Lab',
    'microbe mission free response': 'Microbe Mission',
    'fluid mechanics': 'Physics Lab',
    'general': None,
    'evolution & ecology': 'Ecology',
    'fill in the blank': None,
    'options': None,
    'bio-process lab': 'Food Science',
    'anatomy - anatomy and physiology': 'Anatomy - Cardiovascular',
    'wave properties and radio waves': 'Physics Lab',
    'water monitoring': 'Water Quality',
    'write it do it b': 'Fun',
    'microbial effects & treatments': 'Microbe Mission',
    'quantum': 'Physics Lab',
    'programming': 'Fun',
    'microbiology': 'Microbe Mission',
    'fun physics time': 'Physics Lab',
    'tiebreaker': None,
    'wind power free response': 'Wind Power',
    'climatology': 'Meteorology',
    'rosaceae': 'Plant Biology',
    'true/false': None,
    'microbial ecology': 'Microbe Mission',
    'geometry': 'Technical Problem Solving',
    'bioprocess lab': 'Food Science',
    'endangered species': 'Ecology',
    'team prop': None,
    'scientific processes': 'Experimental Design',
    'microbe mission matching': 'Microbe Mission',
    'cell biology - plants': 'Plant Biology',
    'mechanics': 'Physics Lab',
    'geography': 'Geologic Mapping',
    'fun food': 'Food Science',
    'anatomy - proteins': 'Protein Modeling',
    'measurements': 'Technical Problem Solving',
    'anatomy - respiratory - diagram': 'Anatomy - Respiratory',
    'evolution': 'Ecology',
    'microbes in industry': 'Microbe Mission',
    'energy sources': 'Thermodynamics',
    'boom beach': 'Fun',
    'anatomy - cardiovascular,anatomy - lymphatic,anatomy - excretory': 'Anatomy - Cardiovascular',
    'population growth issues': 'Ecology',
    'write it, do it': 'Technical Problem Solving',
    'ecology general': 'Ecology',
    'oceanography': 'Remote Sensing',
    'nobel prize': None,
    'applied game theory': 'Fun',
    'weather terms': 'Meteorology',
    'reach for the stars': 'Reach for the Stars',
    'anatomy - cancer': 'Disease Detectives',
    'diseases': 'Disease Detectives',
    'anatomy - immune/nervous': 'Anatomy - Nervous',
    'cell biology of hiv infection': 'Cell Biology',
    'units of measure': 'Technical Problem Solving',
    'human organs': 'Anatomy - Digestive',
    'question': None,
    'wifi': 'WiFi Lab',
    'disease detectives free response': 'Disease Detectives',
    'dna process - replication, transcription, and translation': 'Cell Biology',
    'anatomy - digestive - histology2': 'Anatomy - Digestive',
    'ecology/microbe mission': 'Microbe Mission',
    'extraterrestrial objects': 'Astronomy',
    'highway map': 'Geologic Mapping',
    'pokemon': 'Fun',
    'fagaceae': 'Plant Biology',
    'science quiz bowl': 'Fun',
    'elements': 'Chemistry Lab',
    'leaves': 'Plant Biology',
    'hay day': 'Fun',
    'microbial agents & pandemics': 'Disease Detectives',
    'anatomy - all': 'Anatomy - Cardiovascular',
    'microbes': 'Microbe Mission',
    'betulaceae': 'Plant Biology',
    'moons': 'Astronomy',
    'organic chemistry': 'Chemistry Lab',
    'k-pop trivia': 'Fun',
    'short answer': None,
    'dna mutation & repair': 'Cell Biology',
    'human impact': 'Human Impact on Environment',
    'clash of clans': 'Fun',
    'scioly events': None,
    'instruments and miscellaneous topics': 'Sounds of Music',
    'no_event': None,
    'chemistry - organic': 'Chemistry Lab',
    'fatty acids': 'Chemistry Lab',
    'dynamic planet - glaciers': 'Dynamic Planet - Glaciers',
    'matching': 'Experimental Design',
    'earth science - astronomy': 'Astronomy',
    'mystery architecture': 'Tower',
    'test_type': 'Experimental Design',
    'earth science - oceanography': 'Dynamic Planet - Oceanography',
    'muscular system and joints': 'Anatomy - Muscular',
    'no category': 'Fun',
    'experiment and data analysis': 'Experimental Design',
    'earth science': 'Geologic Mapping',
    'cryptography - theory and hands on': 'Codebusters',
    'internet terminology': 'Cybersecurity',
    'designer genes - crispr': 'Designer Genes',
    'pedigrees & karyotypes': 'Cell Biology',
    'anatomy - case studies': 'Anatomy - Muscular',
    'chemistry - solutions': 'Chemistry Lab',
    'indoor agriculture': 'Plant Biology',
    'dynamic planet - tectonics': 'Dynamic Planet - Tectonics',
    "dynamic planet - earth's fresh waters": "Dynamic Planet - Earth's Fresh Waters",
    'event coordinators': 'Wright Stuff',
    'chemistry - general': 'Chemistry Lab',
    'chemistry - acid/base': 'Chemistry Lab',
    'browser concepts': 'Cybersecurity',
    'wind energy': 'Wind Power',
    'coral reef macroflora and fauna': 'Water Quality',
    'crime scene': 'Crime Busters',
    'astronomy - quantum': 'Astronomy',
    'algorithm design': 'Data Science',
    'highway': 'Road Scholar',
    'physics - equations': 'Physics Lab',
    'event organization': 'Technical Problem Solving',
    'authentication and security': 'Cybersecurity',
    'experimental and data analysis': 'Experimental Design',
    'score statistics': 'Fermi Questions',
    'towers': 'Tower',
    'anatomy - misc': 'Anatomy - Integumentary',
    'physics - astronomy': 'Astronomy',
    'circuit lab - free response': 'Circuit Lab',
    'dynamic planet - oceanography': 'Dynamic Planet - Oceanography',
    'chemistry - reactions': 'Chemistry Lab',
    'symmetric cryptosystems': 'Codebusters',
    'anatomy - respiratory/anatomy - muscular': 'Anatomy - Respiratory',
    'maine mileage diagram': 'Road Scholar',
    'physics - kinematics': 'Physics Lab',
    'physics - vectors': 'Physics Lab',
    'chemistry lab free response': 'Chemistry Lab',
    'physics - thermodynamics': 'Thermodynamics',
    'energy conservation': 'Physics Lab',
    'water monitoring and analysis': 'Water Quality',
    'chemistry - bonding': 'Chemistry Lab',
    'earth science - geology': 'Geologic Mapping',
    'cell cycle & chromosomes': 'Cell Biology',
    'anatomy - muscular - true/false': 'Anatomy - Muscular',
    'write it cad it': 'Machines',
    'anatomy - cardiovascular (tiebreaker)': 'Anatomy - Cardiovascular',
    'chemistry - quantum mechanics': 'Chemistry Lab',
    'road scholar b': 'Road Scholar',
    'sounds of music fill in the blank': 'Sounds of Music',
    'physics - forces': 'Physics Lab',
    'event logistics': 'Mission Possible',
    'circuitlab': 'Circuit Lab',
    'earth science - mapping': 'Geologic Mapping',
    'anatomy - pathophysiology': 'Anatomy - Immune',
    'earth science - seismology': 'Dynamic Planet - Earthquakes, Volcanoes, and Tectonics',
    'identification': 'Forensics',
    'dynamic planet - earthquakes, volcanoes, and tectonics': 'Dynamic Planet - Earthquakes, Volcanoes, and Tectonics',
    'web technologies': 'Cybersecurity',
    'case study': 'Experimental Design',
    'anatomy - protein modeling': 'Protein Modeling',
    'aging': 'Cell Biology',
    'hashing': 'Codebusters',
    'subjective': 'Experimental Design',
    'chemistry - gases': 'Chemistry Lab',
    'anatomy - respiratory - oxyhemoglobin dissociation': 'Anatomy - Respiratory',
    'physics - gravity': 'Gravity Vehicle',
    'public-key cryptography': 'Codebusters',
    'physics - circuits': 'Physics Lab',
    'physics - electromagnetism': 'Physics Lab',
    'chemistry - laws': 'Chemistry Lab',
    'physics - waves': 'Physics Lab',
    'event coordinator information': 'Wright Stuff',
    'salinometer testing': 'Water Quality',
    'satellite': 'Astronomy',
    'road map reading': 'Road Scholar',
    'acids and bases': 'Chemistry Lab',
    'constants': 'Physics Lab',
    'coral reef macroflora & fauna': 'Water Quality',
    'memes': 'Fun',
    'coral reef macroflora and fauna identification': 'Remote Sensing',
    'road scholar short answer': 'Road Scholar',
    'kinetics': 'Chemistry Lab',
    'hallmarks of cancer': 'Cell Biology',
    'ecology rules': 'Ecology',
    'air': 'Meteorology',
    'parasitology': 'Disease Detectives',
    'oxidation reactions': 'Chemistry Lab',
    'chemistry - periodicity': 'Chemistry Lab',
    'gpcrs!': 'Cell Biology',
    'environmental chemistry/analytes': 'Environmental Chemistry',
    'anatomy - plant': 'Plant Biology',
    'chemistry, kinetics': 'Chemistry Lab',
    'dynamic planet fill in the blank': 'Dynamic Planet - Glaciers',
    'quantum theory': 'Physics Lab',
    'environmental chemistry/spectrophotometry': 'Environmental Chemistry',
    'geoguesser': 'Remote Sensing',
    'membrane potentials': 'Neuroscience',
    'physics, waves': 'Crave the Wave',
    'on-off pathways': 'Cell Biology',
    'physics, optics': 'Optics',
    'chemistry - phases': 'Chemistry Lab',
    'chemistry - acids and bases': 'Chemistry Lab',
    'astronomy free response': 'Astronomy',
    'chemistry - nuclear': 'Chemistry Lab',
    'miscellaneous': 'Fermi Questions',
    'scibowl': 'It\'s About Time',
    'vitamins': 'Food Science',
    'chemistry - atomic structure': 'Chemistry Lab',
    'angiogenesis': 'Cell Biology',
    'marine biology': 'Dynamic Planet - Oceanography',
    'meme machine': 'Fun',
    'chemistry - fire': 'Chemistry Lab',
    'surface temperatures': 'Meteorology',
    'misc. - computer science': 'Cybersecurity',
    'cryptography': 'Codebusters',
    'lab techniques': 'Chemistry Lab',
    'relativity': 'Physics Lab',
    'plate tectonics': 'Dynamic Planet - Tectonics',
    'matching questions': 'Fermi Questions',
    'virology': 'Microbe Mission',
    'anatomy - biochemistry and anatomy - digestive': 'Anatomy - Digestive',
    'vertebrate zoology': None, # Could also be Ecology or Ornithology, but Skeletal is anatomy related
    'trivia': 'Fermi Questions',
    'volcanoes': 'Dynamic Planet - Earthquakes, Volcanoes, and Tectonics',
    'satellite map': 'Remote Sensing',
    'protein folding': 'Protein Modeling',
    'invertebrate zoology': None, # Could also be Microbe Mission but Entomology is a better fit for 'zoology'
    'cybersecurity principles': 'Cybersecurity',
    'physics experiments': 'Physics Lab',
    'anatomy - food labels': 'Food Science',
    'ecology and evolution': 'Ecology',
    'wave theory': 'Crave the Wave',
    'harmonic oscillators': 'Physics Lab',
    'chemistry, laboratory': 'Chemistry Lab',
    'glaciers': 'Dynamic Planet - Glaciers',
    'general relativity': 'Physics Lab',
    'earthquakes': 'Dynamic Planet - Earthquakes, Volcanoes, and Tectonics',
    'misc. - other': 'Fermi Questions',
    'dynamic planet matching': 'Dynamic Planet - Tectonics',
    'dynamic planet': 'Dynamic Planet - Tectonics',
    'ethology': 'Ecology',
    'astronomical distances': 'Astronomy',
    'ecological succession': 'Ecology',
    'chemistry free response': 'Chemistry Lab',
    'student-created map': 'Geologic Mapping',
    'atomic theory': 'Chemistry Lab',
    'laboratory': 'Chemistry Lab',
    'cranial nerves': 'Anatomy - Nervous',
    'misc. - mathematics': 'Fermi Questions',
    'pain': 'Neuroscience',
    'pathology': 'Disease Detectives',
    'earth and space, geology': 'Geologic Mapping',
    'plant diversity': 'Plant Biology',
    'satellite map short answer i': 'Remote Sensing',
    'diffraction': 'Optics',
    'misc': 'Fermi Questions',
    'disney trivia': 'Fun',
    'petrographic microscopy': 'Rocks and Minerals',
    'sound and vibration': 'Sounds of Music',
    'physics, thermodynamics': 'Thermodynamics',
    'topographic map short answer': 'Geologic Mapping',
    'chemistry, solutions': 'Chemistry Lab',
    'anatomy - designer genes': 'Designer Genes',
    'topographic maps': 'Geologic Mapping',
    'cellular respiration': 'Cell Biology',
    'physics, fluids': 'Physics Lab',
    'computers': 'Cybersecurity',
    'anatomy - pathology': 'Disease Detectives',
    'satellite map short answer ii': 'Remote Sensing',
    'physics, modern': 'Physics Lab',
    'earth/space science': 'Astronomy',
    'machines - free response': 'Machines',
    'solar system': 'Astronomy',
    'image analysis': None,
    'remote sensing image a': 'Remote Sensing',
    'updates': 'Data Science', # Educated guess, could also be Cybersecurity or Fun depending on context
    'plant anatomy': 'Plant Biology',
    'remote sensing applications': 'Remote Sensing',
    'tie breaker questions': 'Fermi Questions', # Could also be Technical Problem Solving
    'dynamic planet - glaciers free response': 'Dynamic Planet - Glaciers',
    'nearpod directions': 'Experimental Design', # Educated guess, could also be Technical Problem Solving or Fun
    'free_response': 'Experimental Design', # Could also be Fermi Questions
    'ecology - short fill': 'Ecology',
    'anatomy - crispr history': 'Designer Genes', # Could also be Cell Biology or Anatomy - Immune
    'ecology - tiebreaker': 'Ecology',
    'test instructions': None, # Educated guess, could also be Technical Problem Solving or Fun
    'remote sensing satellites and sensors': 'Remote Sensing',
    'excretory system': 'Anatomy - Excretory',
    'pre-build meme prompts and directions': 'Fun', # Educated guess, could also be Game On or Cybersecurity
    'protein modelling': 'Protein Modeling',
    'remote sensing image c': 'Remote Sensing',
    'climate change': 'Human Impact on Environment', # Could also be Environmental Chemistry or Dynamic Planet series
    'electromagnetic spectrum': 'Physics Lab', # Could also be Optics or Astronomy
    'road map test': 'Road Scholar', # Could also be Geologic Mapping
    'remote sensing fill in the blank': 'Remote Sensing',
    'ecology - completion': 'Ecology',
    'redox': 'Chemistry Lab',
    'dynamic planet - earthquakes': 'Dynamic Planet - Earthquakes, Volcanoes, and Tectonics',
    'zoology': 'Ecology', # Could also be Ornithology, Entomology, Herpetology depending on context
    'dynamic planet - geologic mapping': 'Geologic Mapping',
    'wastewater technology': 'Water Quality', # Could also be Environmental Chemistry
    'feedback_form': 'Experimental Design', # Educated guess, could also be Data Science or Technical Problem Solving
    'lymphatic system': 'Anatomy - Lymphatic',
    'acoustics': 'Sounds of Music', # Could also be Physics Lab
    'anatomy - crispr/cas9': 'Designer Genes', # Could also be Cell Biology or Anatomy - Immune
    'watershed resource management': 'Water Quality', # Could also be Dynamic Planet - Earth's Fresh Waters or Ecology
    'dynamic planet - meteorology': 'Meteorology',
    'indiana wastewater operators manual & clean water act': 'Water Quality', # Could also be Environmental Chemistry
    'ph': 'Chemistry Lab', # Could also be Environmental Chemistry or Water Quality
    'remote sensing calculations': 'Remote Sensing',
    'marine carbonate chemistry & water hardness': 'Water Quality', # Could also be Environmental Chemistry
    'geologic history': 'Geologic Mapping', # Could also be Fossils or Rocks and Minerals
    'feedback': None, # Educated guess, could also be Data Science or Technical Problem Solving
    'wind power true false': 'Wind Power',
    'relating velocity, wavelength, and frequency for waves': 'Physics Lab', # Could also be Optics or Sounds of Music
    'write-it cad it': 'Technical Problem Solving', # Educated guess, could also be Experimental Design or Machines related events
    'dynamic planet - volcanoes, earthquakes, and tectonics': 'Dynamic Planet - Earthquakes, Volcanoes, and Tectonics',
    'satellites and orbits': 'Astronomy', # Could also be Remote Sensing or Physics Lab
    'crowdpurr': None, # Educated guess, could also be Data Science or WiFi Lab
    'remote sensing image b': 'Remote Sensing',
    'periodicity': 'Chemistry Lab', # Could also be Physics Lab
    'anatomy - respiratory and digestive': 'Anatomy - Respiratory', # Arbitrarily chose Respiratory, could be Digestive
    'common antenna designs': 'WiFi Lab', # Could also be Circuit Lab or Detector Building or Physics Lab
    'web architecture + principles of cybersecurity': 'Cybersecurity',
    'volcanism': 'Dynamic Planet - Volcanoes, Earthquakes, and Tectonics',
    'road mapping': 'Geologic Mapping', # Could also be Road Scholar
    'physics/chemistry': 'Physics Lab', # Arbitrarily chose Physics Lab, could be Chemistry Lab
    'cardiovascular system': 'Anatomy - Cardiovascular',
    'dynamic planet - volcanoes': 'Dynamic Planet - Volcanoes, Earthquakes, and Tectonics',
    'ecology - free response': 'Ecology',
    'radio waves': 'Physics Lab', # Could also be Optics or WiFi Lab
    'em wave propagation': 'Physics Lab', # Could also be Optics or WiFi Lab
    'wind power short answer': 'Wind Power',
    'anatomy - research analysis- cytidine deaminase': 'Anatomy - Immune', # Could also be Cell Biology or Designer Genes
    'remote sensing acronym identification': 'Remote Sensing',
    'the electromagnetic spectrum': 'Physics Lab', # Could also be Optics or Astronomy
    'science bowl': 'Data Science',
    'crispr-cas': 'Designer Genes',
    'anatomy - immune fill in the blank': 'Anatomy - Immune',
    'game on b test': 'Game On',
    'aquatic flora and fauna': 'Dynamic Planet - Earth\'s Fresh Waters',
    'mammology': 'Ecology',
    'anatomy - respiratory fill in the blank': 'Anatomy - Respiratory',
    'designer genes free response': 'Designer Genes',
    'archaeology': 'Fossils',
    'astronomy - free response': 'Astronomy',
    'fermi questions measurement': 'Fermi Questions',
    'geologic mapping free response': 'Geologic Mapping',
    'skeletal fill in the blank': 'Anatomy - Skeletal',
    'marine & estuary ecology': 'Ecology',
    'case study 1 - the survivor of the cordyceps apocalypse': None,
    'case study 2 - the penitent thief': 'Anatomy - Muscular',
    'case study 3 - hero of the wild': 'Anatomy - Muscular'

}

print("All values:", [*set([f for f in titles.values() if f is not None])])
# os.exit()
def combine_bank_data(filename="beta_bank.json"):
    """
    Combines JSON objects from a file, extending arrays for same keys
    and filtering out objects with empty 'answers' arrays.

    Args:
        filename (str): The name of the file containing JSON objects.

    Returns:
        dict: A single dictionary containing the combined JSON data.
    """
    combined_data = {}
    excluded_data = {}
    bruh = set()
    with open(filename, 'r') as f:
        for line in f:
            try:
                data = json.loads(line.strip())
                for key, value in data.items():
                    key = key.lower()
                    if key not in titles:
                        bruh.add(key)
                        continue
                    key = titles[key]
                    if key is None:
                        continue
                    if not key in combined_data:
                        combined_data[key] = []
                        excluded_data[key] = []
                    if not isinstance(value,list) or len(value) == 1:
                        continue
                    # Extend the existing list with new items, filtering as needed

                    combined_data[key].extend([
                        item
                        for item in value
                        if item.get('answers') and isinstance(item['answers'],list) and len(item['answers']) > 0 and item.get("question") and len(item['options']) != 1
                        and not (item['answers'][0] == "" or isinstance(item['answers'][0],list) and (item['answers'][0] == [""] or item['answers'][0] == [[]] or item['answers'][0] == [[""]]))
                        and len(item['question']) > 8
                        and not (isinstance(item['answers'][0], str) and "see answer" in item['answers'][0].lower())
                        and not ("based on" in item['question'] and "provided" in item['question'] or "information" in item['question'] and "provided" in item['question'])
                        and not (len(item['question']) < 85 and " this " in item['question'])
                        and not (len(item['question']) < 60 and "this object" in item['question'])
                        and not (isinstance(item['answers'][0],str) and ("answer" in item['answers'][0] or "depends" in item['answers'][0]))
                        and not ("is this?" in item['question'] and len(item['question']) < 40)
                        and not (item['question'].lower().startswith("which letter"))
                        and not (item['question'].lower().startswith("based on your"))
                        and not (item['question'].lower().startswith("based on the"))
                        and not (item['question'].lower().startswith("based on this"))
                        and not (item['question'].lower().startswith("these are"))
                        and not (item['question'].lower().startswith("calculate the"))
                        and not (item['question'].lower().startswith("participants"))
                        and not (len(item['question']) < 3)
                        and not (isinstance(item['answers'][0],str) and item['answers'][0].lower() == "free response")
                        and not (isinstance(item['answers'][0],str) and item['answers'][0].lower() == "requires missing")
                        and not (isinstance(item['answers'][0],str) and item['answers'][0].lower() == "unknown")
                        and not (isinstance(item['answers'][0],str) and item['answers'][0].lower() == "refer to")
                        and not ("station" in item['question'].lower() and not item['question'].lower().startswith("station"))
                        and not (bool(re.search(r"(q|Q)uestion [0-9]+[^:]",item['question'])))
                        and not (bool(re.search(r"(?<=(((i|I)mages*)|(e|E)vents*)|((f|F)eatures*)|(row)|((p|P)owder)|(patient)|((l|L)abels*)|(labeled)|(horomone)|(items*)|(ganglion)|(disorders*)|((r|R)egion)|(when)|((N|n)euron)|(Box)|((s|S)pecimens*)|((m|M)odels*)|((l|L)ayers*)|(part of)|((s|S)olids*)|((f|F)igure)|((m|M)etals*)|((h|H)airs*)|((f|F)ibers*)|((p|P)lastics*)|((f|F)ingerprints*)|((s|S)oils*)|((s|S)tructures*)|((p|P)oint)|((u|U)nit)|((p|P)anel)|((f|F)eatures*)|((l|L)iquid)|((f|F)igures*)|((s|S)pecimens*)|((p|P)oints*)|((l|L)etters*)|((f|F)ibers*)|((s|S)ymbol)) (([A-Z]+|[0-9]+)[\s.,?!;:])",item['question'])))
                        and not (len(item['answers']) == 1 and item['answers'][0] == '')
                        and not (sum(map(lambda s: 1 if isinstance(s, str) and len(s)==1 else 0, item['answers'])) > 2)
                        and not (False if not 'options' in item or item['options'] is None else (any(s == "A" for s in item['options']) and not "climate" in item['question'] and not "vitamin" in item['question']))
                        and not (item['question'] == item['answers'][0])
                        and not any(phrase in item['question'].lower() for phrase in [
                            " a?", " b?", " c?", " d?", " g?", " h?", " i?", " j?", " k?", " l?", " m?", " n?", " o?", " p?", " q?", " r?", " s?", " t?", " u?"
                            "this picture", "this image", "this diagram", "this map",
                            "in figure", "pictured below",
                            "this specimen", "this organism", "the photo below",
                            "given information", "the table", "the structures labeled",
                            "specimen 1", "specimen 2", "specimen 3", "specimen 4", "specimen 5",
                            "specimen 6", "specimen 7", "specimen 8", "specimen 9", "specimen 10",
                            "this individual", "Identify #", "diagram below", "the diagram", 
                            "slide above", "picture below", "the picture", "shown above", "shown below", "question #",
                            "indicated by", "diagram to the right", "this device", "these specimens", "multiple choice",
                            "shown to the right", "(left)", "(right)", "graph above",
                            "the reading on", "the image", 
                            "labeled by", "which image", "above image", "below image", "in the image",
                            "depicted", "the figure", "above?", "to the right", "the chart", 
                            "the diagram", "red arrow", "black arrow", "the arrow",
                            "labelled", "for the given", "if this", "above equation",
                            "original test", "fossil above", "question (", "depicted", "projection 1", "projection 2", 
                            "projection 3", "the map?", "circular symbol", "union hill", "locations 1", "location 1", 
                            "at the right?", "on the map", "interpret the", "evidence a", "evidence b", 
                            "evidence c", "which suspect", "what is the id ", "are you currently in a location where you cannot see or talk to your partner?", 
                            "honor code", "from the provided answer key", "according to article", "previous question",
                            "found at the scene", "according to elsa's bio", "from the scenario", "on my honor", 
                            "following questions refer to light and electron microscopes", "given the following graph",
                            "shown on the graph", "suspect no.", "from the given scenario", "the competitors"
                        ])
                        and not any(question in item['question'].lower() for question in [
                            "information needed"
                        ])
                    ])
            except json.JSONDecodeError:
                print(f"Skipping invalid JSON line: {line.strip()}")
    print("Unknown keys: ", bruh)
    return [combined_data, excluded_data]

# Combine the data from bank.txt
raw = combine_bank_data()
combined_bank = raw[0]

for key, questions in combined_bank.items():
    seen = set()
    new_questions = []
    for q in questions:
        # 1. Set difficulty: default to 0.5 if missing/None, and cap values > 1 at 0.9.
        if 'difficulty' not in q or q['difficulty'] is None:
            q['difficulty'] = 0.5
        elif q['difficulty'] > 1:
            q['difficulty'] = 0.9
        elif q['difficulty'] == 0:
            q['difficulty'] = 0.1

        # 2. Convert answer elements to integers if an options list exists and is non-empty.
        if 'options' in q and isinstance(q['options'], list) and len(q['options']) > 0:
            if 'answers' in q:
                # If answers is a list
                if isinstance(q['answers'], list):
                    q['answers'] = [a if isinstance(a,int) or isinstance(a,list) or a is None else 1 if a.upper() == 'A' else 2 if a.upper() == 'B' else 3 if a.upper() == 'C' else 4 if a.upper() == 'D' else 5 if a.upper() == 'E' else 6 if a.upper(    ) == 'F' else a for a in q['answers']]
                    # Check if every answer is numeric or a numeric string.
                    all_numeric = all(
                        isinstance(a, (int, float)) or (isinstance(a, str) and a.strip().isdigit())
                        for a in q['answers']
                    )
                    if all_numeric:
                        # Convert all answers to integers.
                        q['answers'] = [int(a) for a in q['answers']]
                    else:
                        # If not all answers are numeric, take only the first answer,
                        # and if it exactly matches one of the options, convert it to the
                        # 1-indexed position of that option.
                        first_ans = q['answers'][0]
                        first_ans_str = str(first_ans)
                        if first_ans_str in q['options']:
                            q['answers'] = [q['options'].index(first_ans_str) + 1]
                else:
                    # When answers is a single value.
                    if isinstance(q['answers'], (int, float)) or (isinstance(q['answers'], str) and q['answers'].strip().isdigit()):
                        try:
                            q['answers'] = int(q['answers'])
                        except (ValueError, TypeError):
                            pass
                    else:
                        # For a non-numeric answer, try matching it against the options.
                        ans_str = str(q['answers'])
                        if ans_str in q['options']:
                            q['answers'] = q['options'].index(ans_str) + 1


        # 3. Codebusters-specific filtering.
        if key == "Codebusters":
            question_text = q.get('question', '')
            # Count the number of uppercase letters.
            capital_count = sum(1 for c in question_text if c.isupper())
            # Skip if the text is less than 200 characters and contains fewer than 25 capital letters.
            if len(question_text) < 200 and capital_count < 25:
                continue

        # 4. Filter out duplicate questions based on the "question" text.
        question_text = q.get('question')
        if question_text in seen:
            continue
        seen.add(question_text)
        new_questions.append(q)
    flag = False
    for answer in q['answers']:
        if not isinstance(answer,int) and answer.lower() in q.get("question").lower():
            flag = True 
            break
    if flag:
        continue
    combined_bank[key] = new_questions



# Write the combined JSON object to bank_filtered.json
with open("final.json", 'w') as outfile:
    json.dump(combined_bank, outfile)
with open("excluded.json", 'w') as outfile:
    json.dump(raw[1],outfile, indent=4)
print("Combined and filtered data written to final.json")
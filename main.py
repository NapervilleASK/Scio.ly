from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.http import MediaIoBaseDownload
import re
import io
import os
from pdfminer.high_level import extract_text 
import google.generativeai as genai
import json

# All SciOly test banks
folder_links = ['1iyma2Yx6SQA9d0l9UGssZoZ49-LEZ5bI', '1hq-11lPgS8Yq_dfgnrxfMUq_Tlv7FZ7omCBB', '1-HqDXYAZcejYfFcDbusXXtdhaX8MbUcW', '1V6wNtk5zvdGoGJ61CtwBfwoumNuwl747' "1O5L_UAFupSa0GuBz8ZAD6FRDhRNrIOXf", '1HROgfeTl2G43ZSXjm6k8kb7O4zG8A-fu', '1z8LwIB6p2ZGM8fqDC0oG3QL8JeV8aG5H', '1dOg4VfnQG8slPQVP887PEO0OmFhVSSzZ', '1_CWR_rg1XdDbo1eCwbYzCWP4gOgVnoua', '1v3ZNnfV9M2MBTkbfxXcUY5KetM_-V_2P', '11scWTMvMucVqpdFBUjkluL_Xrlbs8dGE', '10RudIkUKZe2ZIFySQcUOvDlVQGCeFiUd', '1LvjKVW1jNaYapxvY3qF19TLY0Zan8qpv', '152pUw9g81hZhBLB6MV8PJNoKWX3B4iai', '18va6_rBbYw05UaqcQQCD7BAkdh48UZN5', '1fGIDpV6a0ORRiUAbq6Wrdc0BdxEOovzh', '1UbCn9hftkUhTCfNduTbKPo0-FR0vJmmK', '1GbBQRng4pxKxykcRiJKR9MZ7vAHuPP6H', '1-tsYsrgpwDVHBQlSfGxM74qWPPaslYUr', '1Y7buTFhs7U3Kd525PF6eeI7BJhoJZOPC', '1zn5zzR_Nr-PPdjRJybrtQwKhfkRG3IJC', '1rzVRMu7W6SxLoQASux5yA3Ui9P1uZkfs', '1xwYa0Vpl3tHnPiBvGDGbuIK0nEeu1LbH', '1rX8xJlB30NtRHO3RTuIfhqEzNsQKVfL5', '1CA5XHwhdFOZCJ2ES7ITprWoksCWORtX8', '12FWeJAGtJMLNl23hwUICX8UtCxe82-nU', '1XYTB8A9UAI_fuMPZ945RHtihKrihpNS0', '1WjEGUQ1v0pwkxuvAoPuWFaWk_m9Atqjx', '1AlyoRMtJpxaxUen5g32QSr1RSsfb8ZLs', '1JNYgRW4INdGz4dWvGzvlugDuljzL8_s2', '1R4p-eoORhUaJfgd5Xx3SfSVaDtOE6Gge', '1oZCbJrUGCSDP5Ri06ZwxoEFziysMNAb5', '1HDZvUwrqPeYFIkbDlZ7RF8mGYMO8nnwJ', '1moQDbIwa8-BBg-zVl8zKLBrfdOIxrqMk', '1vwoNOyhkEiPYZoCP1k3lRfh5E9V7_Vvu', '1lTgv1XSHLPmnWXblO7wtjUmVhdiit0WX', '1WAWO-UMCnaYMd8AIFKefgl7Fdg5keGp2', '1-IvKrMX_vw-2MQjiL3payF1fnHeOmQyZ', '1OYqBkCYi44uxhJivexYW7FOpVnBOz_7K', '1UDWmwNkkoBw1X4tQ6-MX6yD2K59xs-G_', '1VxWl3crjSoA0_mB89Gg4KgpiT5nnHfEG', '12msP3XgqOJGMFjrFk7ZEnFtBz4pGdCuG', '1CC2sOz8P2mDImZ6BAsIeiUmVzH1c3Rb9', '11v3MGE07t8FIpDpLFHvijSr-qeRVb4Xp', '173fFK0af9iD1UJsgX2u6DiwMEb1tbgWf', '1w2Rqq6dYjzVlfdVFFdMgM_PxPtKEZgTH', '145UHXMxOCw3HD_96u6NThKGZOAz_E_VI', '1MQ3tvV9HZYVtBL5rgvEFKqCwIMX7n69g', '15J2z5LFEVw5viRTbIxpFHrzvkNxoDg3R', '19_dbGVXc0FGIM8Tnc7rOltC0itgIKiVu', '17vIUN2TB60Oh-6JSeQYsUoGhbGhyrTPs', '1iFWBirR_3XfMaMsUVFFDxRuQeavYRSIV', '1LZsgdiaV03jP3MmTnC6ecGrh7H8x_NrI', '1FK89x4X796k5EEt44tzOoF__5aDaaFON', '1boGp0TkwJhyXwA5m41lxOl_Af35VsNls', '1nEeX66uXjDt1x2SIsIJSekfvHdORlfXSs4WsX1piiuGPIKSyDduZtQtn6jZsDyvyD7Vv7S7t', '1UDUMUAmaoinPCNNGbMYAh4BdPHHwJjtb', '1q1Dp8UWoRnM9Lfks-CVsnTiARrTCvWgn', '1zw8FV7ckEzKLFxXKq8VKXvybEAEHRq45', '1-QxFq3Kb3EBH4MNGzVGFM4pJZIfL2OHp', '1GyVv6gRfdmnv6GjUIQ9cV2AN19GHMqle', '1dl9j-DcpJ1MwcsHhGh9KUuSqHAQ3BBba', '1Zkx8Ff2AU8dQnEw-mV9Dgpy9cuZvK-0b', '1DzDpuDSMsQ4rype0KjGV0eCz-05NkZAz', '1yueokX907oLJwn0ciuH5frr76higotKC', '1TMNILZO9AJoX2F59BiYI9WW6SO4BdPkN', '1LmOcZmFC031XqLHQjyqCQqTDH7vUIj3E', '1EJsqz6WLyjMOVAXd8FcU72q2e49Yyzxm', '1hHuR5gT0RzM3kddQJUEYxxVtj2E1oMqJ', '16Bq3Sd-tFdfJNg_zvYhXRLdkqoByaP2l', '1S2rEBjyC5coFC8reDAlGrEly8oTaYdTc', '1bYsvKo-Sr1iqLKSkKZS4x4H40r4xegBe', '1HVPILYcjVVgm0Xh6TEgO8eaQobKox5BE', '1CIN0Yq0nU0PokLvJ2RNIVZt2WmbJ492M', '1WrhBeK56tbBmvTn2k6Hx6aBObxxv_GPv', '1t67OdhZRW7FkenNQUKV7svAGme3j5lVG', '1lhyd0Svy-JQlZEGEjPPB2q6qK2AC7yJH', '1vqu1dY89xBqqZxI9rdYYvlrghVQnMKAe', '1dh3T45cSCr6dkTllG-z05Sncfdtypy-t', '1XR79OZNxdwn--E_OoBF-s2225m1BfSvN', '1SPws4xgGX8qgcm3tACbRSY5tCT4bUcSG', '1VGyX6pHXHfwz-2QP5nT56HIi_IzGBLjn', '1ThcmyQZGiIZN66miKHKXg68muQ51CnNg', '1csEVP9EV9Y6-nhZ6-NfAsEi15H-V2Bqi', '1KqXCDYmATTcN6ARd0djOTziEXTdYAdmy', '1PG2_VBfOVMhR5eiQ21yjTpm7x5tLfmRa', '1dT2hn7Hv1VXASl-XR--xgS5valGxZYrq', '1ur-B7eWRyt70p7wkg7Wg1pGkkKaE1W0B', '1sDRu5Z0_Ob0n1P-H3daT84i_a7GKMUWm', '1YnhsbdhlrCAVwBHwYIaXgbOJmPWhgpJ6', '1PpadvuBMi6MgESulk6j8beewkoIFj-bn', '1VJzwoh2Pzg9jkCoJljHDPTphZfVvHoxx', '1njR0iqCPr7YW8XW_FlvaTEv4nU6gAINx', '1sVSw15a6LeT-Z7x9qOyxg8QcxFT65_HQ', '1sGJWoKsQ6GIwyLoYvXQI_8axYA7rso8U', '1kthkoUgPHm1tlo3gLpLAu_Zr65eoJUI5', '1TRQCWDCqDjQHGY4vwIOaUhyDDa4mNPjp', '1pXXsRglN5v5HfG_r2TulAeGYv_bFT7z7', '1iq9HI2naY6_5mlcLykVeQUZjAeDfvSqT', '1I4FvwKo5BIyIabiegfhhcLCtQCHabqP3', '1IsCJdX4yMBoE9T2d-WZTMLFN2cpRoc5T', '1Nv6AvrWNlJ3HiOK3D00c98D-qCX4kSdi', '1qe8mnZTSnO5SCfbNCgCtaSN2_bGUjXGh', '1x4fl2rGF49l1imEp0Xg_zXCGqrXlZT3K', '1Df2ZJ8tdgUuIBPBEQpBV0iP8MW4paDCk', '14inBI0VlhCqHEKUmLUQ6yHXLX1A15OC6', '1_GMig5s8uc9eti-vYm94rPxGBoeORKue', '1B2Pw4GzvuodcmPRSz36FficDsBHfh9U2', '1e2tAROLDf3SN3UMcBIn4Smi2SXB4EaFe', '1f3MPRWWfXkWImz1yxrhYUhFFychcJHX7', '11NvL0LMkxKgsFh21Ul4RwAgbhsmJpda0', '1-h0tIxxtAH21nBPmtefdUq0yhocUO4Hz', '1W238K-m0fXYy33UI6qjD_H45fsTq9MyZ', '12AEJJmEQmMROC9-6dPiK5jUp9RDy_j0J', '1pfFyQhlfguTqEJjpXov9pIxvvPKcHZpd', '0B8zsKGejhk8QfnNYXzkwV1h2STZpMDdBQ2VYOW1td2RiWEEtckdlWTdfT19DTEFsYTVVVGs', '1M1Bhjypo-78cqFMswVmYfeXjQBBZw5Dh', '1MbUUj9A_-F2qZ2ULgiufw5BWJytt4d4Q', '1SuL2ORETV660yK8VRzdI83OUtyfJI7H5', '15a1YDspbn97sh77AIqCHz6DCM6e0TyE9', '1nuwz12RY_fROv3-9XLAbULxj1oM3gVsP', '1DKWyV3LQQmCm-r-pl-4B3z_DFG9kYekR', '1pY6RKvz8KGr6Z9tlKIJALtfbg58jDd1u', '1p23UjfzgDuSONOE9DtUlrulLrNeFUm9z', '1_63CTy4s5e2Kf6ncg1G-T3a1cYdL58tB', '1fhAySyzINkA5AQxIgv5vp0tM0Ysx8J9g', '10ADANsfPli3tkieZZoGZ4j2yDt3tZs1I', '1o0bnX6QG3krfssWCHkN3o2R_MBzZyjrw', '1_J57iYz0XxIwc6x4v7DSVI7RXXa_U202', '1yAqY6zn9VxY2OyCZlD7GTna1NAC45LmF', '1U_83pft8DJMgjFhUgGlNx3-RODVYWi3R', '1KaedADenFdH8dqgCKcf29oXQpZyjpdte', '11p-L-rAL2KTPqpkycg1zQ9U2ArvK7W_I', '1ADZ-EdI94T1hre188rxGhESYG5GjaeQZ', '1m4_4IAe9nFc5UZQBTZF2vU9EYLhj4EEH', '1_sQ9jrHWmVt857CcwY9uIGeSGFBl1Ymz', '1UoVRFw-tdmRxM4-hEeJxHwViW5vMlZID', '1Pp7tLWEzpmJ1NSmZ4GbHJGMD_albpTd4', '1le1-CYcJ3_YetP_3X7jwe50O6mwihLCp', '1W_Tcjn-LttQ246C2tPeweBwkCcHhhNKZ', '1BWVRP_eFPscYhMYOZH-mPVZBAYrBvzZL', '1tBevfGz0vVUfvhGj1x51NpPOMlOYGK8_', '1xAWXoJj12l7gEe8V-uGteRskrYssGim6', '1O3cmlJEC5AvUUc8IwOy2k9oMt8ifKPQq', '1Vz6d8PiGfYzk0QDA1cG0ESvFNf_hgW4H', '1u8e22PI_d65G-lxnYPiPz13B5zC1vKv3', '1kDL5X0l-hgUHF0dZDbA2g2au_7m9EtJR', '1nxQcwJ80HB0tfZnIXroGUNeou_yJsKsm', '15wSx7279Pnz8Voy_6Ca7j7MHEHlRBBvh', '1W9lanA5clZz7F-37ni0jn3zXr6Dv6qBt', '1SfRGTD4hto_3QMKW9kc4J6fQ4sJNfCQV', '1qPTWGCxwQmFc0jOCri7dcf1q8LHZ07tu', '1T5Oy_vs5VGG0X-H1IqQAYJ1DaS45pwAm', '15QaImPeZZ8DQqF0mJdDo7j81jpCgQGdD', '1AG-tp0_hyX1YlZfusrOISaq_6tu4u2Ah', '1NvgiSGFHW0VjA7WcAre-O0JYl2n6CoJH', '1IezNuPN-iMRXysBbIYx4SE817eXhvobp', '1jpxLXIQqPHINhUQAp3MH1BO0U_za_cTI', '1PSJ15uMXL9zzIMa-m8cLvf1PX7CiWqVo', '1z4ixSqqHfGeJd2JnZnSmftCSyxFyRLLb', '1TMCWdLlOjnRFUy7SBuYbj6ur__xwkAk7', '13yNsNguUT7TDjLAdM3b6kffzSh7rgR5A', '1xoVEkV1YEXa6dTuFEzXKIo-QgZj84MAP', '1WfsB8nqU5ho4CiWw9KjXEaC-CK4eV-_a', '1XdYRVuOHAr05HZSuHLSgbNroFl-kWnBl', '1xAQZDOqHEQh_O2G1evPyIorNiNPrgbtG', '1z-15Pu6jZeryJbhiV7QVkAuzbKir1CFm', '1iSR_xc48OuykFRPaUi_kJ1oQWFLgrW3q', '1as5mvrBbUYOkKc9Mpa8u7fy2XmBm8yXy']

# All past SciOly Events
events = [
    "Air Trajectory",
    "Anatomy - Skeletal",
    "Anatomy - Muscular",
    "Anatomy - Integumentary",
    "Anatomy - Cardiovascular",
    "Anatomy - Lymphatic",
    "Anatomy - Excretory",
    "Anatomy - Respiratory",
    "Anatomy - Digestive",
    "Anatomy - Immune",
    "Anatomy - Nervous",
    "Anatomy - Sense Organs",
    "Anatomy - Endocrine",
    "Astronomy",
    "Boomilever",
    "Bridge",
    "Bridge Building",
    "Bungee Drop",
    "Cell Biology",
    "Chemistry Lab",
    "Circuit Lab",
    "Codebusters",
    "Compound Machines",
    "Designer Genes",
    "Detector Building",
    "Disease Detectives",
    "Dynamic Planet",
    "Ecology",
    "Electric Vehicle",
    "Entomology",
    "Environmental Chemistry",
    "Experimental Design",
    "Fermi Questions",
    "Flight",
    "Forensics",
    "Forestry",
    "Fossils",
    "Game On",
    "Geologic Mapping",
    "Gravity Vehicle",
    "Green Generation",
    "Helicopter",
    "Herpetology",
    "Hovercraft",
    "Invasive Species",
    "It's About Time",
    "Machines",
    "Materials Science",
    "Microbe Mission",
    "Mission Possible",
    "Mousetrap Vehicle",
    "Optics",
    "Ornithology",
    "Ping Pong Parachute",
    "Protein Modeling",
    "Remote Sensing",
    "Robot Arm",
    "Rocks and Minerals",
    "Scrambler",
    "Sounds of Music",
    "Technical Problem Solving",
    "Thermodynamics",
    "Tower",
    "Trajectory",
    "Water Quality",
    "WiFi Lab",
    "Wind Power",
    "Wright Stuff",
    "Write It Do It",
]

# --- 1. Google Drive API Setup ---
def authenticate_google_drive():
    """Authenticates with Google Drive API and obtains token.json."""
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"Error refreshing credentials: {e}")
                os.remove(TOKEN_FILE) # Invalidate the potentially bad token
                creds = None  # Force re-authentication
        if not creds or not creds.valid:
            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
    try:
        service = build('drive', 'v3', credentials=creds)
        # print(service)
        return service
    except HttpError as error:
        print(f'An error occurred: {error}')
        return None


def list_files_in_folder(service, folder_id):
    """Retrieves a list of all PDF file IDs from a Google Drive folder and its subfolders.

    Args:
        service: The Google Drive API service object.
        folder_id: The ID of the Google Drive folder.

    Returns:
        A list of strings, where each string is the ID of a PDF file.
    """
    pdf_ids = []
    try:
        query = f"'{folder_id}' in parents and mimeType='application/pdf' and trashed=false"
        results = service.files().list(q=query, fields="nextPageToken, files(id, name)").execute()
        items = results.get('files', [])
        pdf_ids.extend(items)

        # Retrieve subfolders
        subfolder_query = f"'{folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
        subfolder_results = service.files().list(q=subfolder_query, fields="nextPageToken, files(id, name)").execute()
        subfolders = subfolder_results.get('files', [])

        for subfolder in subfolders:
            pdf_ids.extend(list_files_in_folder(service, subfolder['id']))

        nextPageToken = results.get('nextPageToken')
        while nextPageToken:
            results = service.files().list(q=query, fields="nextPageToken, files(id)", pageToken=nextPageToken).execute()
            items = results.get('files', [])
            pdf_ids.extend(items)
            nextPageToken = results.get('nextPageToken')

        subfolder_nextPageToken = subfolder_results.get('nextPageToken')
        while subfolder_nextPageToken:
            subfolder_results = service.files().list(q=subfolder_query, fields="nextPageToken, files(id)", pageToken=subfolder_nextPageToken).execute()
            subfolders = subfolder_results.get('files', [])
            for subfolder in subfolders:
                pdf_ids.extend(list_files_in_folder(service, subfolder['id']))
            subfolder_nextPageToken = subfolder_results.get('nextPageToken')
    except:
        print("Couldn't grab file")

    return pdf_ids

def download_file(service, file_id, filename):
    """Downloads a file from Google Drive."""
    try:
        request = service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
            print(f"Download {int(status.progress() * 100)}%.")

        with open(filename, 'wb') as f:
            fh.seek(0)
            f.write(fh.read())
        return True
    except HttpError as error:
        print(f'An error occurred: {error}')
        return False

# --- 2. Convert PDF to Text ---
def pdf_to_text(pdf_path):
    """Converts a PDF file to plain text."""
    try:
        text = extract_text(pdf_path)
        return text
    except Exception as e:
        print(f"Error converting PDF to text: {e}")
        return None

# --- 3. Gemini API Interaction ---

def extract_questions_with_gemini(client, text, events, idx):
    genai.configure(api_key=GEMINI_API_KEY[idx % len(GEMINI_API_KEY)]) 
    prompt = f"""
    Identify the event this test most likely belongs to from the following list: {', '.join(events)}.
    Extract all multiple-choice questions and output a raw JSON (no backticks or markdown) object of this test, similar to 
    this schema:
    Example JSON output format:
    {{
      "ecology": [
        {{
          "question": "What is the primary role of decomposers in an ecosystem?",
          "options": ["Producing energy", "Breaking down dead organic matter", "Consuming producers", "Providing shelter"]
          "answers": [2]
        }},
        {{
          "question": "Which of the following is an example of a symbiotic relationship?",
          "options": ["Predation", "Competition", "Mutualism", "Parasitism"],
          "answers": [1,2,3,4] // All of the options are correct
        }}
      ]
    }}

    DO NOT include any questions that require an image or anything other than the question itself to solve. You may leave the option field blank for free response, but have one element in the answers array providing a correct response. 
	Create an empty json object if no test is present
    Here's the test:
    ```{text}```

    """
    try:
        response = client.generate_content(prompt)
        if response:
            return response.text
        else:
            print("Gemini API returned an empty response.")
            return None
    except Exception as e:
        print(f"Error interacting with Gemini API: {e}")
        return None
# --- Main Execution ---

GOOGLE_DRIVE_CREDENTIALS_FILE = 'credentials.json'
GEMINI_API_KEY = ["AIzaSyCfqBUffTO__rekXIKOU3g5gaWtNiXqUJE","AIzaSyBd3NxLibgtZm9eVJtPN1l7TaKrFIfqsRw","AIzaSyAiA-njA4SwlA6sI12VKJHnYBNdKDzM0yI","AIzaSyA7tWKPs5TzSLGA9DJqKTjUyvCHs-zkRh4","AIzaSyAjTo2gr-jQvXPMfd3wgSgF4GlI9xSd2ug","AIzaSyAOP4QEzlMmiI2EMzSF-f8zCE2_3X8PMQI","AIzaSyDir7-baCKB81J_gF4WudMSL1LoxUK_yV4", "AIzaSyA5LYpfW01qntmc9Ifb-5-RYr_nixG0S84", "AIzaSyCDBOHU4HvmrTUUWbqB-Pxg-u9qXjq3_2U", "AIzaSyD6qsgfOe0TELPqky4mkgt41I10xIIUQkU", "AIzaSyCfUUKinpceLrrafVhqJ7I5O3uLWapF4WY", "AIzaSyAwYVnq9eWNVbCLZptAAqmmFsj7NENhkHM", "AIzaSyC-6-q5j9Bb39pQ7yBA-BvS7Pqk6wGVcfk", "AIzaSyABBTUl3--C51WakbbLrUpUK2zPy_QtvTM", "AIzaSyBHtubyKwYj2J4N0ONNMN9SNqQDhfFUr6c", "AIzaSyB0LVzvI2qZARHYckGF5xAZcDDcSLv_G4c", "AIzaSyAGInMj66MuPgMyCQWZkXist9HYQIQKhXo", "AIzaSyDJ9dwjY1bDymkkD3ehtAnjId5maFPaTnw", "AIzaSyBvvCWGdK3rVU5DlEfAkT4Ggc6zbG6H9To", "AIzaSyA2bblOFrd_7VX70ZS85FGMF1Bjx_VrlOM", "AIzaSyD_KnuW5Wm98KxS5gZKBtn9qEcsD0wyebI" ]
OUTPUT_DIR = "extracted_questions"
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
CREDENTIALS_FILE = 'credentials.json'
TOKEN_FILE = 'token.json'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- Initialize APIs ---
drive_service = authenticate_google_drive()
if not drive_service:
    exit()
gemini_model = genai.GenerativeModel("gemini-2.0-flash-exp")
all_extracted_questions = {}

# --- Process Folders and Files ---
idx = -1
with open("bank.json", 'a') as writefile:
    for folder_id in folder_links:
        files = list_files_in_folder(drive_service, folder_id)
        if not files:
            print(f"No PDF files found in folder: {folder_id}")
            continue

        print(f"Processing folder: {folder_id}")
        for file in files:
            if not (file['name'].lower().endswith('.pdf') and re.search(r"test|exam", file['name'].lower())):
                print(f'{file['name']} was not a pdf that contained the text "test" or "exam"')
                continue

            print(f"Downloading file: {file['name']}")

            pdf_path = os.path.join(OUTPUT_DIR, file['name'])

            if not download_file(drive_service, file['id'], pdf_path):
                print('Can\'t download file')
                continue

            print(f"Converting {file['name']} to text...")

            text_content = pdf_to_text(pdf_path)
            if len(text_content) < 100:
                print("too short")
            print(f"Extracting questions using Gemini...")
            idx += 1
            gemini_output = extract_questions_with_gemini(gemini_model, text_content, events, idx)

            try:

                questions_json = json.dumps(json.loads(re.search(r"\{.*\}", gemini_output, re.DOTALL).group(0)))

                writefile.write(questions_json + "\n")

                print("Success!")

            except json.JSONDecodeError as e:

                print(f"  Error decoding Gemini JSON output for {file['name']}: {e}")
                print(f"  Gemini Output:\n{gemini_output}")

            os.remove(pdf_path) # Clean up the downloaded PDF

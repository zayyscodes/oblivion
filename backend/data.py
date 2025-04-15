import random

suspects = {
    'Chris Blaine': {
        'age': '28', 'height': '6 feet 3 inches', 'hair_color': 'black', 'eye_color': 'blue',
        'occupation': 'ceo', 'motive': 'Financial Loss', 'location': 'office',
        'knows_victim': True, 'lie_probability': 0.2, 'probability': 0.2
    },
   'Jason Blue': {
        'age': '31', 'height': '5 feet 11 inches', 'hair_color': 'brown', 'eye_color': 'blue',
        'occupation': 'singer', 'motive': 'Romantic Fallout / Rejection', 'location': 'home',
        'knows_victim': False, 'lie_probability': 0.3, 'probability': 0.2
    },

    'Kate Ivory': {
        'age': '35',
        'height': '5 feet 8 inches',
        'hair_color': 'black',
        'eye_color': 'brown',
        'occupation': 'banker',
        'motive': 'Revenge / Financial Disputes', 'location': 'studio',
        'knows_victim': True, 'lie_probability': 0.25, 'probability': 0.2
    },
    'Poppy Green': {
        'age': '26',
        'height': '5 feet 5 inches',
        'hair_color': 'brown',
        'eye_color': 'green',
        'occupation': 'model',
        'motive': 'Jealousy / Career Ambition','location': 'flower shop',
        'knows_victim': True, 'lie_probability': 0.45, 'probability': 0.2
    },
    'Violet Riley': {
        'age': '27',
        'height': '5 feet 9 inches',
        'hair_color': 'blonde',
        'eye_color': 'brown',
        'occupation': 'florist',
        'motive': 'Hidden Past / Buried Secrets', 'location': 'gallery',
        'knows_victim': True, 'lie_probability': 0.1, 'probability': 0.2
    },
    'Zehab Rose': {
        'age': '22',
        'height': '5 feet 5 inches',
        'hair_color': 'brown',
        'eye_color': 'brown',
        'occupation': 'writer',
        'motive': 'Inheritance Dispute / Family Resentment','location': 'library',
        'knows_victim': True, 'lie_probability': 0.5, 'probability':0.4
    }
}

weapons = {
    1: 'Wrench',
    2: 'Rope',
    3: 'Revolver',  
    4: 'Lead Pipe',
    5: 'Knife',
    6: 'Candlestick',
}


def get_suspect_clues(suspect_data):
    clues = []

    if '6 feet' in suspect_data['height']:
        clues.append("A tall shadow was seen on the hallway camera.")
    if suspect_data['hair_color'] == 'black':
        clues.append("A few strands of black hair were found near the body.")
    if suspect_data['hair_color'] == 'brown':
        clues.append("A brown hair strand was caught on the broken window.")
    if suspect_data['hair_color'] == 'blonde':
        clues.append("Golden strands were found on the victim’s shoulder.")
    if suspect_data['eye_color'] == 'blue':
        clues.append("Witnesses mentioned piercing blue eyes behind a mask.")
    if suspect_data['eye_color'] == 'green':
        clues.append("A reflection of green eyes was seen in a mirror snapshot.")
    if 'additional_info' in suspect_data and 'beard' in suspect_data['additional_info']:
        clues.append("Traces of coarse facial hair were found on the victim’s jacket.")
    if suspect_data['occupation'].lower() == 'ceo':
        clues.append("A branded pen was left behind, engraved with the CEO's company logo.")
    if suspect_data['occupation'].lower() == 'singer':
        clues.append("A torn concert ticket was found near the scene.")
    if suspect_data['occupation'].lower() == 'banker':
        clues.append("An expensive cufflink with bank initials was discovered under the couch.")
    if suspect_data['occupation'].lower() == 'model':
        clues.append("Traces of high-end perfume lingered in the air.")
    if suspect_data['occupation'].lower() == 'teacher':
        clues.append("A school ID card lanyard was caught on a nail at the scene.")
    if suspect_data['occupation'].lower() == 'writer':
        clues.append("A page torn from a novel with handwritten notes was found crumpled.")
    motive = suspect_data['motive'].lower()

    if 'financial' in motive:
        clues.append("Bank statements revealed sudden financial pressure related to Sierra.")
    if 'romantic' in motive or 'rejection' in motive:
        clues.append("A torn love letter was found in the fireplace.")
    if 'revenge' in motive:
        clues.append("A journal entry from Sierra hinted at someone vowing revenge.")
    if 'jealousy' in motive or 'ambition' in motive:
        clues.append("A social media post was deleted minutes after the murder—one laced with envy.")
    if 'secret' in motive or 'past' in motive:
        clues.append("Old photographs were scattered, some with faces scratched out.")
    if 'inheritance' in motive or 'family' in motive:
        clues.append("A forged will was discovered hidden in the victim’s drawer.")

    return clues

def get_weapon_clues(weapon_type):
    weapon_clue_map = {
        'Wrench': "A heavy metallic object left a dent on the wall.",
        'Rope': "Rope fibers were found on the victim's wrist.",
        'Revolver': "Gunpowder residue was detected in the air.",
        'Lead Pipe': "Blunt force trauma marks match a cylindrical shape.",
        'Knife': "A clean, deep cut suggests a sharp blade was used.",
        'Candlestick': "Wax droplets were found near the impact site."
    }
    return [weapon_clue_map.get(weapon_type, "No specific clues found for this weapon.")]


from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import uuid
from data import suspects, weapons, get_suspect_clues, get_weapon_clues

app = Flask(__name__)
CORS(app)

# Map frontend suspect names to backend names
SUSPECT_NAME_MAPPING = {
    "chris": "Chris Blaine",
    "jason": "Jason Blue",
    "kate": "Kate Ivory",
    "poppy": "Poppy Green",
    "violet": "Violet Riley",
    "zehab": "Zehab Rose"
}
REVERSE_SUSPECT_MAPPING = {v.lower(): k for k, v in SUSPECT_NAME_MAPPING.items()}
WEAPON_NAME_MAPPING = {
    "candlestick": "Candlestick",
    "wrench": "Wrench",
    "rope": "Rope",
    "pipe": "Lead Pipe",
    "revolver": "Revolver",
    "knife": "Knife"
}

# --- Game State ---
game_state = {
    'killer_name': None,
    'killer_weapon': None,
    'fake_locations': {},
    'lie_counter': {},
    'liars': [],
    'suspect_statements': {},
    'alibi_claims': {},
    'checked_suspects': set(),
    'valid_suspects_csp': [],
    'game_id': None,
    'update_probabilities_on_guess': True
}

# --- Helper Functions ---
def update_probability(suspect, evidence, lie_probability, killer_clue=None, weapon_clue=None, suspect_name=None):
    prior = suspect['probability']
    likelihood = 1.0 - lie_probability if lie_probability <= 0.5 else 0.5
    clue_boost = sum(0.05 for clue in evidence if clue in get_suspect_clues(suspect))
    if killer_clue and killer_clue in get_suspect_clues(suspect):
        clue_boost += 0.1
    if weapon_clue and weapon_clue in get_weapon_clues(game_state['killer_weapon']):
        clue_boost += 0.05
    if suspect_name and suspect_name in game_state['liars']:
        clue_boost += 0.1
    posterior = prior * likelihood + clue_boost
    total_posterior = sum(s['probability'] * (1.0 - s['lie_probability'] if s['lie_probability'] <= 0.5 else 0.5) for s in suspects.values())
    return min(max(posterior / (total_posterior + 1e-10), 0), 1) if total_posterior > 0 else prior

def check_alibi_conflict(suspect, other_suspects, fake_locations):
    for other in other_suspects:
        if suspect == other:
            continue
        if suspect['location'] == other['location']:
            if fake_locations.get(suspect['name'], suspect['location']) != suspect['location']:
                return True
    return False

def normalize_probabilities():
    total = sum(s['probability'] for s in suspects.values())
    if total > 0:
        for s in suspects.values():
            s['probability'] /= total

def evaluate_motive_opportunity(suspect_name, weapon, room, fake_locations):
    suspect = suspects[suspect_name]
    motive_score = 0.1 if suspect['motive'].lower() in ['revenge', 'jealousy', 'inheritance'] else 0.05
    opportunity_score = 0.1 if fake_locations.get(suspect_name, suspect['location']) == room else 0.0
    return motive_score + opportunity_score

# --- RL Setup ---
learning_rate = 0.1
discount_factor = 0.9

def get_action_reward(is_correct_action):
    return 0.2 if is_correct_action else -0.2

def rl_update(suspect, reward, suspect_name=None):
    current_value = suspect.get('value', suspect['probability'])
    future_value = 0.5 if suspect['lie_probability'] > 0.5 else 0.2
    if suspect_name and game_state['lie_counter'].get(suspect_name, 0) > 1:
        future_value += 0.3
    new_value = current_value + learning_rate * (reward + discount_factor * future_value - current_value)
    suspect['value'] = min(max(new_value, 0), 1)
    suspect['probability'] = suspect['value']

# --- CSP Functions ---
def is_consistent(suspect_name):
    suspect = suspects[suspect_name]
    actual_or_fake_location = game_state['fake_locations'].get(suspect_name, suspect['location'])
    if actual_or_fake_location != suspects[game_state['killer_name']]['location']:
        return False
    has_strong_motive = any(m in suspect['motive'].lower() for m in ['revenge', 'jealousy', 'inheritance', 'financial', 'romantic'])
    is_liar = suspect_name in game_state['liars']
    return has_strong_motive or is_liar

def solve_with_csp():
    valid_candidates = [name for name in suspects if is_consistent(name)]
    game_state['valid_suspects_csp'] = valid_candidates
    return valid_candidates

# --- Dialogue Generation for Stage 2 ---
def generate_suspect_dialogues():
    dialogues = {}
    for name, data in suspects.items():
        frontend_name = REVERSE_SUSPECT_MAPPING.get(name.lower(), name.lower())
        location_to_show = game_state['fake_locations'].get(name, data['location'])
        
        occupation_quips = {
            "CEO": "Tall, dark, and suspicious, huh? You forgot charming.",
            "Singer": "Don’t worry, detective, I only kill with high notes.",
            "Banker": "Sounds like a profile from a loan application. Hope this interview doesn’t come with hidden charges.",
            "Model": "So you’ve done your homework. Let’s hope it wasn’t for a gossip column.",
            "Florist": "I arrange flowers, not funerals. Just so we’re clear.",
            "Writer": "Writers imagine murders—they don’t commit them. At least not outside the pages."
        }
        occupation_response = occupation_quips.get(data['occupation'], "I guess I’m more than my profile, detective.")

        motive_probes = {
            "Financial": "Maybe she knew something about your... offshore accounts?",
            "Romantic": "Maybe you got jealous seeing her with someone else?",
            "Revenge": "Or maybe you were still angry about how she handled the divorce.",
            "Competition": "Or maybe you thought she was about to outshine you in the industry?",
            "Jealousy": "Maybe jealousy turned darker than you admit?",
            "Inheritance": "Or maybe she rejected your latest manuscript and you snapped?"
        }
        motive_probe = motive_probes.get(data['motive'], "Maybe you had a hidden reason to get rid of her?")

        motive_responses = {
            "Financial": "Scoff-worthy, detective. If I were hiding skeletons, they’d be better dressed.",
            "Romantic": "*Concerned look* That’s a painful thought—but no. She moved on, and I respected that.",
            "Revenge": "*Sighs* I’m not proud of everything, but anger doesn’t equal murder.",
            "Competition": "*Scoffs* She was good—but there’s room on the runway for two.",
            "Jealousy": "*Nervous* Jealous? Sure. But murderous? That’s a leap, detective.",
            "Inheritance": "*Nervously chuckles* Wow. That’s dark—even for me. No, she was my best critic."
        }
        motive_response = motive_responses.get(data['motive'], "That’s a stretch, detective. I had no reason to harm her.")

        alibi_responses = {
            "library": f"In the {location_to_show} reading quarterly reports. Boring stuff, not murder-worthy.",
            "home": f"Home alone, writing breakup songs. Romantic fallout makes good lyrics, not crime scenes.",
            "studio": f"I was in my {location_to_show}, reviewing mortgage portfolios. Riveting work, truly.",
            "flower shop": f"At the {location_to_show} rehearsing poses for a brand shoot. I kill looks, not people.",
            "gallery": f"At the {location_to_show} arranging a floral display. You can ask the curator, if she's not busy admiring her own ego.",
            "library": f"In the {location_to_show}. Writing, researching, deleting whole paragraphs. A killer of words, maybe."
        }
        alibi_response = alibi_responses.get(location_to_show.lower(), f"I was at the {location_to_show}, doing my usual work.")

        alibi_followups = {
            "library": "Books over boardrooms, huh? Odd for a CEO with a reputation for late-night deals.",
            "home": "A lonely night, no witnesses. Convenient for more than just heartbreak.",
            "studio": "Nothing says 'I didn’t do it' like subprime lending, huh?",
            "flower shop": "You do have killer heels. Could’ve stomped out more than a photoshoot.",
            "gallery": "That ego may just save you, if she confirms your story.",
            "library": "The library seems popular. Funny how killers and creatives share locations."
        }
        alibi_followup = alibi_followups.get(location_to_show.lower(), "That sounds convenient—too convenient, maybe.")

        alibi_rebuttals = {
            "library": "Even CEOs get tired of spreadsheets. It was a quiet night.",
            "home": "Songs don’t write themselves, detective. I have timestamped drafts.",
            "studio": "Well, I have buried people in paperwork. That’s the only crime I’m guilty of.",
            "flower shop": "*Raises brow* You think I’d ruin my manicure for murder? Please.",
            "gallery": "Believe me, if I were to kill anyone, it wouldn’t be the victim—it’d be her.",
            "library": "Coincidence is the backbone of mystery, detective. You should know."
        }
        alibi_rebuttal = alibi_rebuttals.get(location_to_show.lower(), "I assure you, detective, my night was uneventful.")

        motive_explanations_1 = {
            "Financial": "Because I respected her. She left the company on her own terms. No lawsuit, no bad blood.",
            "Romantic": "Because I loved her. Even after the breakup.",
            "Revenge": "Because I’ve already lost her once. Divorce was painful enough.",
            "Competition": "We worked together. She was competitive, sure, but we laughed between takes.",
            "Jealousy": "We’ve known each other since braces and breakouts. She was the maid of honor at my wedding.",
            "Inheritance": "She was my sister. Not by blood, but she still read my drafts, told me when my prose sucked."
        }
        motive_explanation_1 = motive_explanations_1.get(data['motive'], "I had no reason to harm her. We were on good terms.")

        motive_explanations_2 = {
            "Financial": "She was sharp—I even offered her a return package once.",
            "Romantic": "I wrote her into every song, even the sad ones. She was... unforgettable.",
            "Revenge": "We were civil after everything. I had no reason to hurt her.",
            "Competition": "She gave me posing tips. You don’t kill people who help you shine.",
            "Jealousy": "I may have wanted to throttle her sometimes—but kill her? Never.",
            "Inheritance": "We fought like siblings do, but family is family."
        }
        motive_explanation_2 = motive_explanations_2.get(data['motive'], "She was a part of my life, detective. I wouldn’t hurt her.")

        dialogue = [
            {
                "id": "intro",
                "char": "detective",
                "text": f"You're {name}—{data['age']}, {data['height']}, {data['hair_color']} hair, {data['eye_color']} eyes, {data['occupation']} by title."
            },
            {
                "id": "intro",
                "char": frontend_name,
                "text": occupation_response
            },
            {
                "id": "alibi",
                "char": "detective",
                "text": f"Where were you last night, {name.split()[0]}?" if name != "Kate Ivory" else "Your alibi, Ms. Ivory?"
            },
            {
                "id": "alibi",
                "char": frontend_name,
                "text": alibi_response
            },
            {
                "id": "alibi",
                "char": "detective",
                "text": alibi_followup
            },
            {
                "id": "alibi",
                "char": frontend_name,
                "text": alibi_rebuttal
            },
            {
                "id": "alibi",
                "char": "detective",
                "text": "Quiet nights tend to get loud when someone's trying to hide something."
            },
            {
                "id": "alibi",
                "char": "detective",
                "text": motive_probe
            },
            {
                "id": "alibi",
                "char": frontend_name,
                "text": motive_response
            },
            {
                "id": "motive",
                "char": "detective",
                "text": f"Tell me, {name.split()[0]}—why wouldn’t you kill the victim?" if name != "Kate Ivory" else "Why wouldn’t you kill her, Kate?"
            },
            {
                "id": "motive",
                "char": frontend_name,
                "text": motive_explanation_1
            },
            {
                "id": "motive",
                "char": frontend_name,
                "text": motive_explanation_2
            }
        ]
        dialogues[frontend_name] = dialogue
    return dialogues

# --- API Endpoints ---
@app.route('/api/start_game', methods=['POST', 'GET'])
def start_game():
    game_state['killer_name'] = random.choice(list(suspects.keys()))
    game_state['killer_weapon'] = random.choice(list(weapons.values()))
    game_state['game_id'] = str(uuid.uuid4())
    game_state['fake_locations'] = {}
    game_state['lie_counter'] = {name: 0 for name in suspects}
    game_state['liars'] = []
    game_state['suspect_statements'] = {}
    game_state['alibi_claims'] = {}
    game_state['checked_suspects'] = set()
    game_state['valid_suspects_csp'] = []

    for name in suspects:
        suspects[name]['probability'] = 0.5 if name == game_state['killer_name'] else suspects[name].get('probability', 0.3)

    for name, data in suspects.items():
        original_location = data['location']
        possible_locations = [s['location'] for s in suspects.values() if s['location'] != original_location]
        if name == game_state['killer_name']:
            game_state['fake_locations'][name] = random.choice(possible_locations)
            game_state['liars'].append(name)
        elif random.random() < data['lie_probability']:
            game_state['fake_locations'][name] = random.choice(possible_locations)
            game_state['liars'].append(name)
        else:
            game_state['fake_locations'][name] = original_location

    if not game_state['liars']:
        non_killers = [s for s in suspects if s != game_state['killer_name']]
        forced_liar = random.choice(non_killers)
        game_state['liars'].append(forced_liar)
        possible_locations = [s['location'] for s in suspects.values() if s['location'] != suspects[forced_liar]['location']]
        game_state['fake_locations'][forced_liar] = random.choice(possible_locations)

    return jsonify({
        'status': 'success',
        'game_id': game_state['game_id'],
        'message': 'Game started successfully'
    })

@app.route('/api/round1_interview', methods=['GET'])
def round1_interview():
    if game_state['game_id'] is None:
        return jsonify({
            'status': 'error',
            'message': 'No active game. Please start a game using /api/start_game.'
        }), 400

    game_id = request.args.get('game_id')
    if not game_id or game_id != game_state['game_id']:
        return jsonify({
            'status': 'error',
            'message': 'Invalid or missing game_id. Please provide the correct game_id.'
        }), 400

    suspect_dialogues = generate_suspect_dialogues()

    return jsonify({
        'status': 'success',
        'suspect_dialogues': suspect_dialogues
    })

@app.route('/api/round2_alibis', methods=['GET'])
def round2_alibis():
    if game_state['game_id'] is None:
        return jsonify({
            'status': 'error',
            'message': 'No active game. Please start a game using /api/start_game.'
        }), 400

    game_id = request.args.get('game_id')
    if not game_id or game_id != game_state['game_id']:
        return jsonify({
            'status': 'error',
            'message': 'Invalid or missing game_id. Please provide the correct game_id.'
        }), 400

    game_state['alibi_claims'] = {}
    for name in suspects:
        others = [o for o in suspects if o != name]
        seen = random.sample(others, min(2, len(others)))
        game_state['alibi_claims'][name] = {}
        for target in seen:
            actual_location = suspects[target]['location']
            if name == game_state['killer_name'] or random.random() < suspects[name]['lie_probability']:
                possible_locations = [s['location'] for s in suspects.values() if s['location'] != actual_location]
                fake_location = random.choice(possible_locations)
                game_state['alibi_claims'][name][target] = fake_location
            else:
                game_state['alibi_claims'][name][target] = actual_location

    return jsonify({
        'status': 'success',
        'alibi_claims': {REVERSE_SUSPECT_MAPPING.get(name.lower(), name): claims for name, claims in game_state['alibi_claims'].items()}
    })

@app.route('/api/round3_verify_alibi', methods=['POST'])
def round3_verify_alibi():
    if game_state['game_id'] is None:
        return jsonify({
            'status': 'error',
            'message': 'No active game. Please start a game using /api/start_game.'
        }), 400

    try:
        data = request.get_json()
        suspect_name = data.get('suspect_name') if data else None
        if suspect_name in SUSPECT_NAME_MAPPING:
            suspect_name = SUSPECT_NAME_MAPPING[suspect_name]
    except Exception:
        return jsonify({
            'status': 'error',
            'message': 'Invalid JSON data. Please send valid JSON with Content-Type: application/json.'
        }), 400

    if not suspect_name or suspect_name not in suspects:
        return jsonify({'status': 'error', 'message': 'Invalid or missing suspect name'}), 400

    if suspect_name in game_state['checked_suspects']:
        return jsonify({'status': 'error', 'message': 'Suspect already verified'}), 400

    game_state['checked_suspects'].add(suspect_name)
    actual_location = suspects[suspect_name]['location']
    claimed_location = game_state['fake_locations'].get(suspect_name, actual_location)
    verification_result = {
        'suspect': suspect_name,
        'claimed_location': claimed_location,
        'actual_location': actual_location,
        'is_alibi_valid': claimed_location == actual_location
    }

    others_statements = []
    for accuser, claims in game_state['alibi_claims'].items():
        if suspect_name in claims:
            claimed_by_other = claims[suspect_name]
            is_correct = claimed_by_other == actual_location
            others_statements.append({
                'accuser': accuser,
                'claimed_location': claimed_by_other,
                'is_correct': is_correct
            })
            if is_correct:
                reward = get_action_reward(True)
                rl_update(suspects[accuser], reward, accuser)
                suspects[accuser]['probability'] = update_probability(
                    suspects[accuser], get_suspect_clues(suspects[accuser]), 
                    suspects[accuser]['lie_probability'], suspect_name=accuser
                )
            else:
                game_state['lie_counter'][accuser] += 1
                penalty = min(0.2, 0.05 + (game_state['lie_counter'][accuser] * 0.02))
                rl_update(suspects[accuser], -penalty, accuser)
                suspects[accuser]['probability'] = update_probability(
                    suspects[accuser], get_suspect_clues(suspects[accuser]), 
                    suspects[accuser]['lie_probability'], suspect_name=accuser
                )
    normalize_probabilities()

    # Count how many times each suspect is mentioned in alibi_claims
    mention_counts = {name: 0 for name in suspects.keys()}
    for accuser, claims in game_state['alibi_claims'].items():
        for target in claims.keys():
            mention_counts[target] += 1

    # Find suspects who haven't been checked yet
    unchecked_suspects = [
        name for name in suspects.keys() if name not in game_state['checked_suspects']
    ]

    if not unchecked_suspects:
        most_suspected = None
    else:
        # Find the maximum number of mentions among unchecked suspects
        max_mentions = max(
            mention_counts[name] for name in unchecked_suspects
        )
        # Get all unchecked suspects with the maximum mentions
        most_mentioned_suspects = [
            name for name in unchecked_suspects if mention_counts[name] == max_mentions
        ]
        # If there's a tie, pick the one with the highest probability
        most_suspected = max(
            most_mentioned_suspects,
            key=lambda name: suspects[name]['probability'],
            default=None
        )

    return jsonify({
        'status': 'success',
        'verification': verification_result,
        'others_statements': others_statements,
        'most_suspected_suggestion': most_suspected,
        'current_probabilities': {REVERSE_SUSPECT_MAPPING.get(name.lower(), name): round(data['probability'], 2) for name, data in suspects.items()}
    })

@app.route('/api/round4_final_deduction', methods=['POST', 'GET'])
def round4_final_deduction():
    if game_state['game_id'] is None:
        return jsonify({
            'status': 'error',
            'message': 'No active game. Please start a game using /api/start_game.'
        }), 400

    crime_scene = suspects[game_state['killer_name']]['location']
    for name, data in suspects.items():
        boost = evaluate_motive_opportunity(name, game_state['killer_weapon'], crime_scene, game_state['fake_locations'])
        suspects[name]['probability'] = min(1, suspects[name]['probability'] + boost)

    normalize_probabilities()
    valid_suspects_csp = solve_with_csp()

    scored_suspects = [
        (name, data['probability'] + (0.3 if name in valid_suspects_csp else 0))
        for name, data in suspects.items()
    ]
    sorted_suspects = sorted(scored_suspects, key=lambda x: x[1], reverse=True)
    top_suspects = [
        {
            'name': REVERSE_SUSPECT_MAPPING.get(name.lower(), name),
            'probability': round(suspects[name]['probability'], 2),
            'csp_valid': name in valid_suspects_csp
        } for name, _ in sorted_suspects[:2]
    ]

    weapon_clue = random.choice(get_weapon_clues(game_state['killer_weapon']))
    return jsonify({
        'status': 'success',
        'top_suspects': top_suspects,
        'current_probabilities': {REVERSE_SUSPECT_MAPPING.get(name.lower(), name): round(data['probability'], 2) for name, data in suspects.items()},
        'weapon_clue': weapon_clue
    })

@app.route('/api/make_guess', methods=['POST'])
def make_guess():
    try:
        data = request.get_json()
        if not isinstance(data, dict):
            return jsonify({
                'status': 'error',
                'message': 'Invalid JSON data. Must be a JSON object.'
            }), 400

        killer_key = 'killer_name' if 'killer_name' in data else 'killer'
        weapon_key = 'weapon' if 'weapon' in data else 'guess_weapon'
        if killer_key not in data or weapon_key not in data or 'tries_left' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields. Must include "killer_name" (or "killer"), "weapon" (or "guess_weapon"), and "tries_left".'
            }), 400

        guess_killer = data[killer_key]
        guess_weapon = data[weapon_key]
        tries_left = data['tries_left']

        if not isinstance(tries_left, int) or tries_left < 1 or tries_left > 3:
            return jsonify({
                'status': 'error',
                'message': 'Invalid tries_left. Must be an integer between 1 and 3.'
            }), 400

        if guess_killer.lower() in SUSPECT_NAME_MAPPING:
            guess_killer = SUSPECT_NAME_MAPPING[guess_killer.lower()]
        if guess_weapon.lower() in WEAPON_NAME_MAPPING:
            guess_weapon = WEAPON_NAME_MAPPING[guess_weapon.lower()]

        valid_killers = {name.lower(): name for name in suspects.keys()}
        valid_weapons = {w.lower(): w for w in weapons.values()}
        if guess_killer.lower() not in valid_killers or guess_weapon.lower() not in valid_weapons:
            return jsonify({
                'status': 'error',
                'message': f'Invalid killer_name or weapon. Valid killers: {list(valid_killers.values())}, Valid weapons: {list(valid_weapons.values())}'
            }), 400

        guess_killer = valid_killers[guess_killer.lower()]
        guess_weapon = valid_weapons[guess_weapon.lower()]

        if guess_killer == game_state['killer_name'] and guess_weapon == game_state['killer_weapon']:
            return jsonify({
                'status': 'success',
                'correct': True,
                'message': 'Correct! You solved the mystery!'
            })

        tries_left -= 1
        if tries_left == 0:
            return jsonify({
                'status': 'game_over',
                'correct': False,
                'message': f"You've used all your guesses! The killer was {game_state['killer_name']} using {game_state['killer_weapon']}."
            })

        killer_clue = random.choice(get_suspect_clues(suspects[game_state['killer_name']]))
        weapon_clue = random.choice(get_weapon_clues(game_state['killer_weapon']))
        if game_state['update_probabilities_on_guess']:
            for name in suspects:
                if name.lower() == guess_killer.lower():
                    suspects[name]['probability'] = 0.0
                else:
                    suspects[name]['probability'] = update_probability(
                        suspects[name], get_suspect_clues(suspects[name]),
                        suspects[name]['lie_probability'], killer_clue, weapon_clue, suspect_name=name
                    )
            normalize_probabilities()

        return jsonify({
            'status': 'incorrect',
            'correct': False,
            'tries_left': tries_left,
            'killer_clue': killer_clue,
            'weapon_clue': weapon_clue,
            'current_probabilities': {REVERSE_SUSPECT_MAPPING.get(name.lower(), name): round(data['probability'], 2) for name, data in suspects.items()},
            'hint': 'Probabilities updated based on your guess and clues. Focus on suspects with higher probabilities.'
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Invalid JSON data: {str(e)}. Please send valid JSON with Content-Type: application/json.'
        }), 400

@app.route('/api/game_status', methods=['GET'])
def game_status():
    if game_state['game_id'] is None:
        return jsonify({'status': 'error', 'message': 'No active game.'}), 400
    return jsonify({
        'status': 'success',
        'game_id': game_state['game_id'],
        'verified_suspects': list(game_state['checked_suspects']),
        'current_probabilities': {REVERSE_SUSPECT_MAPPING.get(name.lower(), name): round(data['probability'], 2) for name, data in suspects.items()}
    })

if __name__ == '__main__':
    app.run(debug=True)

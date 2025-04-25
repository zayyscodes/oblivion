from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import uuid
from data import suspects, weapons, get_suspect_clues, get_weapon_clues

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})
# Map frontend suspect names to backend names
SUSPECT_NAME_MAPPING = {
    "chris": "Chris Blaine",
    "jason": "Jason Blue",
    "kate": "Kate Ivory",
    "poppy": "Poppy Green",
    "violet": "Violet Riley",
    "zehab": "Zehab Rose",
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

def generate_killer_clue(killer_name):
    suspect_data = suspects.get(killer_name)
    if not suspect_data:
        print(f"Error: No data found for killer {killer_name}")
        return "No additional clues available."
    clues = get_suspect_clues(suspect_data)
    return random.choice(clues) if clues else "No additional clues available."

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
        location_to_show = game_state['fake_locations'].get(name, data['location']).lower()

        occupation_quips = {
            "CEO": "Tall, dark, and suspicious, huh? You forgot charming.",
            "Singer": "Don’t worry, detective, I only kill with high notes.",
            "Banker": "Sounds like a profile from a loan application. Hope this interview doesn’t come with hidden charges.",
            "Model": "So you’ve done your homework. Let’s hope it wasn’t for a gossip column.",
            "Florist": "I arrange flowers, not funerals. Just so we’re clear.",
            "Writer": "Writers imagine murders—they don’t commit them. At least not outside the pages."
        }
        occupation_response = occupation_quips.get(data['occupation'], "I guess I’m more than my profile, detective.")

        alibi_responses = {
            "library": {
                "chris": "In the library reading quarterly reports—business doesn’t sleep, detective.",
                "jason": "At the library, browsing music history books for inspiration.",
                "kate": "I was in the library reviewing investment journals.",
                "poppy": "In the library, flipping through fashion magazines for shoot ideas.",
                "violet": "In the library, researching rare flower species.",
                "zehab": "At the library, buried in gothic novels for my next story."
            },
            "home": {
                "chris": "Home alone, reviewing company contracts—thrilling stuff.",
                "jason": "Home alone, writing breakup songs. The usual.",
                "kate": "At home, balancing my personal accounts.",
                "poppy": "Home alone, practicing poses for a shoot. It’s all about the angles.",
                "violet": "At home, arranging a new bouquet for my shop.",
                "zehab": "Home alone, drafting a new chapter."
            },
            "studio": {
                "chris": "In my studio, preparing for a board meeting. PowerPoint is my alibi.",
                "jason": "At the studio, recording a new track. The mic was my only witness.",
                "kate": "In the studio, reviewing mortgage portfolios. Numbers don’t lie.",
                "poppy": "At the studio, testing lighting for a photoshoot. Glam takes work.",
                "violet": "In the studio, sketching floral designs for a client.",
                "zehab": "At the studio, editing my manuscript. Words are stubborn."
            },
            "flower shop": {
                "chris": "At the flower shop, negotiating a corporate event deal. Even CEOs need decor.",
                "jason": "In the flower shop, picking roses for a music video. It’s aesthetic.",
                "kate": "At the flower shop, buying a gift for a client. Business is personal.",
                "poppy": "At the flower shop, scouting props for a fashion shoot. Flowers sell the vibe.",
                "violet": "In my flower shop, preparing orders. Petals don’t arrange themselves.",
                "zehab": "At the flower shop, observing people for character inspiration."
            },
            "gallery": {
                "chris": "At the gallery, schmoozing investors. Art’s just business in disguise.",
                "jason": "In the gallery, soaking up visuals for my next album cover.",
                "kate": "At the gallery, eyeing art for my office. Taste is an investment.",
                "poppy": "At the gallery, studying poses in portraits. Art inspires fashion.",
                "violet": "In the gallery, delivering floral arrangements for an exhibit.",
                "zehab": "At the gallery, sketching scenes for my novel’s setting."
            },
            "office": {
                "chris": "In my office, closing a deal. The only thing I killed was the competition.",
                "jason": "At the office, meeting my manager about a tour. Paperwork, not murder.",
                "kate": "In my office, finalizing a loan deal. My desk is my alibi.",
                "poppy": "At the office, shooting a campaign ad. Cameras were rolling.",
                "violet": "In the office, delivering a floral order for a meeting.",
                "zehab": "At the office, interviewing a source for my next book."
            }
        }
        alibi_response = alibi_responses.get(location_to_show, {}).get(frontend_name, f"I was at the {location_to_show}, doing my usual work.")

        alibi_followups = {
            "library": "The library seems popular. Funny how killers and scholars share spaces.",
            "home": "A lonely night, no witnesses. Convenient for more than just solitude.",
            "studio": "Studio time, huh? Sounds like a perfect cover for darker work.",
            "flower shop": "Flower shop’s a sweet alibi. Too bad petals can hide thorns.",
            "gallery": "Galleries attract all types. Even those with blood on their hands.",
            "office": "An office alibi? Desks don’t talk, and deals can mask motives."
        }
        alibi_followup = alibi_followups.get(location_to_show, "That sounds convenient—too convenient, maybe.")

        alibi_rebuttals = {
            "library": {
                "chris": "Reports don’t read themselves. I was neck-deep in numbers.",
                "jason": "Music history’s my vibe. No crime in chasing inspiration.",
                "kate": "Journals keep me sharp. Murder’s not my kind of transaction.",
                "poppy": "Fashion mags are my homework. I was planning my next look.",
                "violet": "Rare flowers fascinate me. That’s my only obsession.",
                "zehab": "Gothic novels fuel my work. I’m guilty of bad plots, not murder."
            },
            "home": {
                "chris": "Contracts are my nightlife. No time for crime.",
                "jason": "Songs don’t write themselves. I’ve got drafts to prove it.",
                "kate": "My accounts are cleaner than your theories, detective.",
                "poppy": "Posing practice is my cardio. No drama, just mirrors.",
                "violet": "Bouquets keep me busy. I’m not plotting murders.",
                "zehab": "My chapters don’t kill people. They just bore them."
            },
            "studio": {
                "chris": "Board meetings need prep. My slides are my alibi.",
                "jason": "Studio tracks don’t lie. Check the recordings.",
                "kate": "Portfolios are my life. No room for murder plots.",
                "poppy": "Lighting tests take hours. I was glowing, not scheming.",
                "violet": "Floral sketches are my art. No blood on my pencils.",
                "zehab": "Editing’s my crime. Words, not people, suffer."
            },
            "flower shop": {
                "chris": "Event deals are my game. Flowers were just props.",
                "jason": "Roses set the mood. My video’s proof enough.",
                "kate": "Client gifts build trust. Murder’s bad for business.",
                "poppy": "Props make the shoot. I was styling, not stabbing.",
                "violet": "Orders don’t wait. My shop’s my world.",
                "zehab": "People-watching’s my research. No sinister motives."
            },
            "gallery": {
                "chris": "Investors love art talk. My night was profit, not pain.",
                "jason": "Album visuals need spark. I was dreaming, not killing.",
                "kate": "Art’s a smart buy. My motives are financial, not fatal.",
                "poppy": "Portraits teach poise. I was studying, not slaying.",
                "violet": "Exhibits need flowers. I was decorating, not destroying.",
                "zehab": "Sketches inspire my work. No crimes in my notebook."
            },
            "office": {
                "chris": "Deals don’t close themselves. My office is my fortress.",
                "jason": "Tour plans are hectic. My manager can vouch.",
                "kate": "Loans don’t sign themselves. My desk’s my witness.",
                "poppy": "Ad shoots are chaotic. Cameras caught my every move.",
                "violet": "Floral orders don’t deliver themselves. I was working.",
                "zehab": "Interviews fuel my stories. No murders in my notes."
            }
        }
        alibi_rebuttal = alibi_rebuttals.get(location_to_show, {}).get(frontend_name, "I assure you, detective, my night was uneventful.")
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
            },
            {
                "id": "alibi",
                "char": frontend_name,
            },
            {
                "id": "motive",
                "char": "detective",
                "text": f"Tell me, {name.split()[0]}—why wouldn’t you kill the victim?" if name != "Kate Ivory" else "Why wouldn’t you kill her, Kate?"
            },
            {
                "id": "motive",
                "char": frontend_name,
            },
            {
                "id": "motive",
                "char": frontend_name,
            }
        ]
        # Add Kate's extra intro line
        if name == "Kate Ivory":
            dialogue.insert(2, {
                "id": "intro",
                "char": frontend_name,
                "text": "Hope this interview doesn’t come with hidden charges."
            })
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
    game_state['alibi_claims'] = {}
    game_state['checked_suspects'] = set()
    game_state['valid_suspects_csp'] = []
    game_state['guess_count'] = 0

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

@app.route('/api/round3_get_suggestion', methods=['GET'])
def round3_get_suggestion():
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

    # Count mentions, weighting non-liars higher
    mention_counts = {name: 0 for name in suspects.keys()}
    for accuser, claims in game_state['alibi_claims'].items():
        weight = 1.5 if accuser not in game_state['liars'] else 1.0  # Non-liars are more reliable
        for target in claims.keys():
            mention_counts[target] += weight

    # Find unchecked suspects
    unchecked_suspects = [
        name for name in suspects.keys() if name not in game_state['checked_suspects']
    ]

    if not unchecked_suspects:
        print("No unchecked suspects, returning None")
        return jsonify({
            'status': 'success',
            'most_suspected_suggestion': None,
            'message': 'All suspects have been verified.'
        })

    # Calculate scores: mention count + probability + killer bias
    scores = {}
    killer_name = game_state['killer_name']
    for name in unchecked_suspects:
        score = mention_counts[name] + suspects[name]['probability'] * 10  # Scale probability for impact
        if name == killer_name:
            score += 2.0  # Small bias toward true killer
        scores[name] = score

    # Select suspect with highest score
    most_suspected = max(scores, key=scores.get)
    frontend_name = REVERSE_SUSPECT_MAPPING.get(most_suspected.lower(), most_suspected)
    print(f"True killer: {killer_name}, Suggested: {frontend_name}, Scores: {scores}")

    return jsonify({
        'status': 'success',
        'most_suspected_suggestion': frontend_name,
        'message': f'Suggested suspect: {frontend_name}'
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
        # Slightly higher boost for true killer
        if name == game_state['killer_name']:
            boost += 0.1
        suspects[name]['probability'] = min(1, suspects[name]['probability'] + boost)

    normalize_probabilities()
    valid_suspects_csp = solve_with_csp()

    scored_suspects = [
        (name, data['probability'] + (0.3 if name in valid_suspects_csp else 0) + (0.2 if name == game_state['killer_name'] else 0))
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
    print(f"True killer: {game_state['killer_name']}, Top suspects: {[s['name'] for s in top_suspects]}")

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
        guess_suspect = data.get('suspect')
        guess_weapon = data.get('weapon')
        game_id = data.get('game_id')
        
        # Validate inputs
        if not guess_suspect or not guess_weapon:
            return jsonify({
                'status': 'error',
                'message': 'Missing suspect or weapon in guess.'
            }), 400
        if not game_id or game_id != game_state['game_id']:
            return jsonify({
                'status': 'error',
                'message': 'Invalid or missing game_id.'
            }), 400
        if game_state['game_id'] is None:
            return jsonify({
                'status': 'error',
                'message': 'No active game. Please start a game using /api/start_game.'
            }), 400

        # Map frontend names to backend
        backend_suspect = SUSPECT_NAME_MAPPING.get(guess_suspect.lower(), guess_suspect)
        backend_weapon = WEAPON_NAME_MAPPING.get(guess_weapon.lower(), guess_weapon)
        
        # Validate suspect and weapon
        if backend_suspect not in suspects:
            return jsonify({
                'status': 'error',
                'message': f'Invalid suspect name: {guess_suspect}.'
            }), 400
        if backend_weapon not in weapons.values():
            return jsonify({
                'status': 'error',
                'message': f'Invalid weapon name: {guess_weapon}.'
            }), 400

        guess_count = game_state.get('guess_count', 0) + 1
        game_state['guess_count'] = guess_count
        remaining_tries = 3 - guess_count

        # Check if guess is correct
        if backend_suspect == game_state['killer_name'] and backend_weapon == game_state['killer_weapon']:
            return jsonify({
                'status': 'success',
                'message': 'Correct guess! You solved the case.',
                'is_correct': True,
                'remaining_tries': remaining_tries
            })

        # Handle incorrect guess
        killer_clue = generate_killer_clue(game_state['killer_name'])
        weapon_clue = random.choice(get_weapon_clues(game_state['killer_weapon']))

        # Update probability for the guessed suspect
        suspect_data = suspects[backend_suspect]
        evidence = get_suspect_clues(suspect_data)
        lie_probability = suspect_data['lie_probability']
        suspects[backend_suspect]['probability'] = update_probability(
            suspect_data,
            evidence,
            lie_probability,
            killer_clue=killer_clue,
            weapon_clue=weapon_clue,
            suspect_name=backend_suspect
        )
        normalize_probabilities()

        # Check if tries are exhausted
        if remaining_tries <= 0:
            return jsonify({
                'status': 'game_over',
                'message': f'No tries left! Game over. The killer was {game_state["killer_name"]} with the {game_state["killer_weapon"]}.',
                'is_correct': False,
                'killer_clue': killer_clue,
                'weapon_clue': weapon_clue,
                'remaining_tries': 0
            })

        return jsonify({
            'status': 'incorrect',
            'is_correct': False,
            'killer_clue': killer_clue,
            'weapon_clue': weapon_clue,
            'remaining_tries': remaining_tries
        })

    except Exception as e:
        print(f"Error in make_guess: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Server error: {str(e)}'
        }), 500
    
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

from flask import Flask, jsonify, request
import random
import time
import uuid
from data import suspects, weapons, get_suspect_clues, get_weapon_clues

app = Flask(__name__)

# --- Game State ---
game_state = {
    'killer_name': None,
    'killer_weapon': None,
    'game_start_time': None,
    'fake_locations': {},
    'lie_counter': {},
    'liars': [],
    'suspect_statements': {},
    'alibi_claims': {},
    'checked_suspects': set(),
    'valid_suspects_csp': [],
    'game_id': None,
    'MAX_GAME_DURATION': 300
}

# --- Helper Functions ---
def update_probability(suspect, evidence, lie_probability):
    prior_probability = suspect['probability']
    evidence_likelihood = 1.0
    if lie_probability > 0.5:
        evidence_likelihood *= 0.5
    updated_probability = (evidence_likelihood * prior_probability) / 0.5
    for clue in evidence:
        if clue in get_suspect_clues(suspect):
            updated_probability += 0.05
    return min(max(updated_probability, 0), 1)

def check_alibi_conflict(suspect, other_suspects, fake_locations):
    for other in other_suspects:
        if suspect == other:
            continue
        if suspect['location'] == other['location']:
            if fake_locations.get(suspect['name'], suspect['location']) != suspect['location']:
                return True
    return False

def evaluate_motive_opportunity(suspect_name, weapon, room, fake_locations):
    suspect = suspects[suspect_name]
    motive_score = 0.1 if suspect['motive'].lower() in ['revenge', 'jealousy', 'inheritance'] else 0.05
    opportunity_score = 0.1 if fake_locations.get(suspect_name, suspect['location']) == room else 0.0
    return motive_score + opportunity_score

def check_time():
    if game_state['game_start_time'] is None:
        return False, {
            'status': 'error',
            'message': 'Game has not been started. Please call /api/start_game first.'
        }
    elapsed = time.time() - game_state['game_start_time']
    if elapsed > game_state['MAX_GAME_DURATION']:
        return False, {
            'status': 'timeout',
            'message': f"Time's up! The killer was {game_state['killer_name']} using {game_state['killer_weapon']}."
        }
    return True, None

# --- RL Setup ---
learning_rate = 0.1
discount_factor = 0.9

def get_action_reward(is_correct_action):
    return 1 if is_correct_action else -0.5

def rl_update(suspect, reward):
    suspect['probability'] += learning_rate * reward
    suspect['probability'] = min(max(suspect['probability'], 0), 1)

# --- CSP Functions ---
def is_consistent(suspect_name):
    suspect = suspects[suspect_name]
    if suspect['motive'].lower() not in ['revenge', 'jealousy', 'inheritance']:
        return False
    actual_or_fake_location = game_state['fake_locations'].get(suspect_name, suspect['location'])
    if actual_or_fake_location != suspects[game_state['killer_name']]['location']:
        return False
    if game_state['lie_counter'][suspect_name] < 1:
        return False
    return True

def solve_with_csp():
    valid_candidates = [name for name in suspects if is_consistent(name)]
    game_state['valid_suspects_csp'] = valid_candidates
    return valid_candidates

# --- API Endpoints ---
@app.route('/api/start_game', methods=['POST', 'GET'])
def start_game():
        # Reset game state
    game_state['killer_name'] = random.choice(list(suspects.keys()))
    game_state['killer_weapon'] = random.choice(list(weapons.values()))
    game_state['game_start_time'] = time.time()
    game_state['game_id'] = str(uuid.uuid4())
    game_state['fake_locations'] = {}
    game_state['lie_counter'] = {name: 0 for name in suspects}
    game_state['liars'] = []
    game_state['suspect_statements'] = {}
    game_state['alibi_claims'] = {}
    game_state['checked_suspects'] = set()
    game_state['valid_suspects_csp'] = []

    # Initialize suspect probabilities
    for name in suspects:
        suspects[name]['probability'] = 0.5 if name == game_state['killer_name'] else suspects[name].get('probability', 0.3)

    # Set up fake locations and liars
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

    is_valid, timeout_response = check_time()
    if not is_valid:
        return jsonify(timeout_response), 400
    game_state['suspect_statements'] = {}
    for name, data in suspects.items():
        location_to_show = game_state['fake_locations'].get(name, data['location'])
        game_state['suspect_statements'][name] = {
            'age': data['age'],
            'height': data['height'],
            'hair_color': data['hair_color'],
            'eye_color': data['eye_color'],
            'occupation': data['occupation'],
            'motive': data['motive'],
            'claimed_location': location_to_show
        }

    return jsonify({
        'status': 'success',
        'suspect_statements': game_state['suspect_statements']
    })

@app.route('/api/round2_alibis', methods=['GET'])
def round2_alibis():
    if game_state['game_id'] is None:
        return jsonify({
            'status': 'error',
            'message': 'No active game. Please start a game using /api/start_game.'
        }), 400

    is_valid, timeout_response = check_time()
    if not is_valid:
        return jsonify(timeout_response), 400

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
        'alibi_claims': game_state['alibi_claims']
    })

@app.route('/api/round3_verify_alibi', methods=['POST', 'GET'])
def round3_verify_alibi():

    if game_state['game_id'] is None:
        return jsonify({
            'status': 'error',
            'message': 'No active game. Please start a game using /api/start_game.'
        }), 400
    
    is_valid, timeout_response = check_time()
    if not is_valid:
        return jsonify(timeout_response), 400
    
    if request.method == 'GET':
        suspect_name = request.args.get('suspect_name')
    else:
        try:
                data = request.get_json()
                suspect_name = data.get('suspect_name') if data else None
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
                rl_update(suspects[accuser], reward)
            else:
                game_state['lie_counter'][accuser] += 1
                penalty = 0.05 + (game_state['lie_counter'][accuser] * 0.02)
                rl_update(suspects[accuser], -penalty)

    # Suggest most suspected
    most_suspected = max(
        [(name, data) for name, data in suspects.items() if name not in game_state['checked_suspects']],
        key=lambda x: x[1]['probability'],
        default=(None, None)
    )[0]

    return jsonify({
        'status': 'success',
        'verification': verification_result,
        'others_statements': others_statements,
        'most_suspected_suggestion': most_suspected,
        'current_probabilities': {name: round(data['probability'], 2) for name, data in suspects.items()}
    })

@app.route('/api/round4_final_deduction', methods=['POST', 'GET'])
def round4_final_deduction():
    # Add game state check
    if game_state['game_id'] is None:
        return jsonify({
            'status': 'error',
            'message': 'No active game. Please start a game using /api/start_game.'
        }), 400

    is_valid, timeout_response = check_time()
    if not is_valid:
        return jsonify(timeout_response), 400

    # Apply motive and opportunity boost
    crime_scene = suspects[game_state['killer_name']]['location']
    for name, data in suspects.items():
        boost = evaluate_motive_opportunity(name, game_state['killer_weapon'], crime_scene, game_state['fake_locations'])
        suspects[name]['probability'] = min(1, suspects[name]['probability'] + boost)

    # Run CSP
    valid_suspects_csp = solve_with_csp()

    # Prepare top suspects
    sorted_suspects = sorted(suspects.items(), key=lambda x: x[1]['probability'], reverse=True)
    top_suspects = [
        {
            'name': ts[0],
            'probability': round(ts[1]['probability'], 2),
            'csp_valid': ts[0] in valid_suspects_csp
        } for ts in sorted_suspects[:2]
    ]

    # Get a weapon clue
    weapon_clue = random.choice(get_weapon_clues(game_state['killer_weapon']))

    return jsonify({
        'status': 'success',
        'top_suspects': top_suspects,
        'current_probabilities': {name: round(data['probability'], 2) for name, data in suspects.items()},
        'weapon_clue': weapon_clue
    })
@app.route('/api/make_guess', methods=['POST'])
def make_guess():
    is_valid, timeout_response = check_time()
    if not is_valid:
        return jsonify(timeout_response), 400

    data = request.get_json()
    guess_killer = data.get('killer_name', '').lower()
    guess_weapon = data.get('weapon', '').lower()
    tries_left = data.get('tries_left', 3)

    if guess_killer == game_state['killer_name'].lower() and guess_weapon == game_state['killer_weapon'].lower():
        elapsed = time.time() - game_state['game_start_time']
        minutes, seconds = divmod(int(elapsed), 60)
        return jsonify({
            'status': 'success',
            'correct': True,
            'message': 'Correct! You solved the mystery!',
            'time_taken': f'{minutes} minutes and {seconds} seconds'
        })
    else:
        tries_left -= 1
        if tries_left == 0:
            elapsed = time.time() - game_state['game_start_time']
            minutes, seconds = divmod(int(elapsed), 60)
            return jsonify({
                'status': 'game_over',
                'correct': False,
                'message': f"You've used all your guesses! The killer was {game_state['killer_name']} using {game_state['killer_weapon']}.",
                'time_taken': f'{minutes} minutes and {seconds} seconds'
            })

        # Update probabilities for incorrect guess
        for name in suspects:
            if name.lower() != guess_killer:
                suspects[name]['probability'] = update_probability(
                    suspects[name], get_suspect_clues(suspects[name]), suspects[name]['lie_probability']
                )

        return jsonify({
            'status': 'incorrect',
            'correct': False,
            'tries_left': tries_left,
            'killer_clue': random.choice(get_suspect_clues(suspects[game_state['killer_name']])),
            'weapon_clue': random.choice(get_weapon_clues(game_state['killer_weapon'])),
            'current_probabilities': {name: round(data['probability'], 2) for name, data in suspects.items()}
        })

if __name__ == '__main__':
    app.run(debug=True)
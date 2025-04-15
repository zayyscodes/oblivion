import random
import time
import sys
from data import suspects, weapons, get_suspect_clues, get_weapon_clues

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
    # Fetch the suspect's data from the suspects dictionary
    suspect = suspects[suspect_name]
    
    # Determine the motive score
    motive_score = 0.1 if suspect['motive'].lower() in ['revenge', 'jealousy', 'inheritance'] else 0.05
    
    # Check the suspect's location against the room for opportunity score
    opportunity_score = 0.1 if fake_locations.get(suspect_name, suspect['location']) == room else 0.0
    
    return motive_score + opportunity_score

# --- Game Initialization ---
killer_name = random.choice(list(suspects.keys()))
killer_weapon = random.choice(list(weapons.values()))
suspects[killer_name]['probability'] = 0.5

MAX_GAME_DURATION = 300
game_start_time = time.time()  


def check_time():
    elapsed = time.time() - game_start_time
    if elapsed > MAX_GAME_DURATION:
        print("\n⏰ Time's up! You couldn't solve the mystery in time.")
        print(f"The killer was {killer_name} using the {killer_weapon}.")
        sys.exit()


fake_locations = {}
lie_counter = {name: 0 for name in suspects}

for name, data in suspects.items():
    if name == killer_name:
        original_location = data['location']
        possible_locations = [s['location'] for s in suspects.values() if s['location'] != original_location]
        fake_location = random.choice(possible_locations)
        fake_locations[name] = fake_location
    elif random.random() < data['lie_probability']:
        original_location = data['location']
        possible_locations = [s['location'] for s in suspects.values() if s['location'] != original_location]
        fake_locations[name] = random.choice(possible_locations)

# --- Reinforcement Learning Setup ---
# Learning Rate and Discount Factor for RL
learning_rate = 0.1
discount_factor = 0.9

# Action Feedback - Reward/Penalty based on action outcome
def get_action_reward(is_correct_action):
    return 1 if is_correct_action else -0.5

# Updating probabilities based on action outcomes (RL update)
def rl_update(suspect, reward):
    # Update probability using learning formula (simple Q-learning update)
    suspect['probability'] += learning_rate * reward
    suspect['probability'] = min(max(suspect['probability'], 0), 1)  # Ensure it stays between 0 and 1

# --- Round 1: Interview ---
print("\nRound 1: Interviewing suspects...")
suspect_statements = {}
for name, data in suspects.items():
    print(f"\nInterviewing {name}...")
    print(f"Age: {data['age']}, Height: {data['height']}, Hair: {data['hair_color']}, Eyes: {data['eye_color']}")
    print(f"Occupation: {data['occupation']}, Motive: {data['motive']}")
    location_to_show = fake_locations[name] if name in fake_locations else data['location']
    print(f"Claimed Location at time of murder: {location_to_show}")
    suspect_statements[name] = location_to_show

# --- Round 2: Alibi Claims ---
# --- Round 2: Suspicion & Alibis ---
print("\nRound 2: Suspects give statements about others...")

alibi_claims = {}
for name in suspects:
    others = [o for o in suspects if o != name]
    seen = random.sample(others, 2)
    print(f"\n{name} was asked who they saw:")
    alibi_claims[name] = {}
    for target in seen:
        if random.random() > suspects[name]['lie_probability']:
            actual_location = fake_locations.get(target, suspects[target]['location'])
            alibi_claims[name][target] = actual_location
            print(f"  → {target} was at {actual_location}")
        else:
            other_actual = fake_locations.get(target, suspects[target]['location'])
            possible_locations = [s['location'] for s in suspects.values() if s['location'] != other_actual]
            fake_location = random.choice(possible_locations)
            alibi_claims[name][target] = fake_location
            print(f"  → {target} was at {fake_location}")

# --- Round 3: CCTV Verification with AI Suggestion and Self-Alibi Check ---
print("\nRound 3: Verify suspect alibis with CCTV...")

# Determine most suspected person
most_suspected = max(suspects.items(), key=lambda x: x[1]['probability'])[0]
print(f"\n🤖 AI Suggestion: Based on current evidence, we recommend verifying {most_suspected}'s alibi first.")

checked = set()
max_checks = 3

while max_checks > 0:
    print("\nWould you like to:")
    print(f"1️⃣ Check {most_suspected}'s alibi")
    print("2️⃣ Choose someone else to verify")
    choice_input = input("Your choice (1 or 2): ").strip()

    if choice_input == '1':
        choice = most_suspected
    else:
        available = [s for s in suspects if s not in checked]
        print("\nRemaining suspects to check:", ", ".join(available))
        choice = input("Pick a suspect to verify: ").strip().title()

    if choice not in suspects or choice in checked:
        print("❌ Invalid choice or already verified.")
        continue

    checked.add(choice)
    actual_location = fake_locations.get(choice, suspects[choice]['location'])
    claimed_location = suspect_statements[choice]

    print(f"\n→ CCTV CHECK: {choice} claimed to be at {claimed_location}")
    if claimed_location == actual_location:
        print(f"✅ CCTV confirms {choice}'s self-claimed location.")
    else:
        print(f"❌ CCTV disproves {choice}'s self-claimed location.")

    # Now check what others said about this suspect
    for accuser, claims in alibi_claims.items():
        if choice in claims:
            claimed_by_other = claims[choice]

            if claimed_by_other == actual_location:
                print(f"✅ CCTV confirms {accuser}'s statement about {choice}.")
                reward = get_action_reward(True)
                rl_update(suspects[accuser], reward)
            else:
                print(f"❌ CCTV shows {accuser} lied about {choice}'s location.")
                lie_counter[accuser] += 1
                penalty = 0.05 + (lie_counter[accuser] * 0.02)
                rl_update(suspects[accuser], -penalty)

    max_checks -= 1

    if max_checks == 0:
        break

    print("\nDo you want to:")
    print("1️⃣ Check another suspect’s alibi")
    print("2️⃣ Proceed to final deduction")
    next_action = input("Your choice (1 or 2): ").strip()

    if next_action == '2':
        break
    elif next_action != '1':
        print("❌ Invalid input. Continuing by default...")

# --- Motive + Opportunity Boost ---
crime_scene = suspects[killer_name]['location']
for name, data in suspects.items():
    boost = evaluate_motive_opportunity(name, killer_weapon, crime_scene, fake_locations)
    suspects[name]['probability'] = min(1, suspects[name]['probability'] + boost)

# --- Round 4: Final Deduction ---
print("\nRound 4: Final Deduction")
# AI Analysis: Top 2 suspects based on probabilities
print("\n🧠 AI Analysis: Top suspect(s) based on probabilities:")
sorted_suspects = sorted(suspects.items(), key=lambda x: x[1]['probability'], reverse=True)
top_suspects = sorted_suspects[:2]
for ts in top_suspects:
    print(f" - {ts[0]} (probability: {round(ts[1]['probability'], 2)})")

print("\n📊 Current Probabilities (Sorted):")
for s, p in sorted(suspects.items(), key=lambda x: x[1]['probability'], reverse=True):
    print(f"{s}: {round(p['probability'], 2)}")

# --- Final Guesses and Dynamic Updates ---
tries = 3
while tries > 0:
    guess_killer = input("\nWho do you think the killer is? ").lower()
    guess_weapon = input("What weapon do you think was used? ").lower()

    if guess_killer == killer_name.lower() and guess_weapon == killer_weapon.lower():
        print("\n🎉 Correct! You solved the mystery!")
        break
    else:
        print("\n❌ Wrong guess.")
        print("Here are additional clues to help you:")
        print(f" - Killer Clue: {random.choice(get_suspect_clues(suspects[killer_name]))}")
        print(f" - Weapon Clue: {random.choice(get_weapon_clues(killer_weapon))}")
        for name in suspects:
            if name.lower() != guess_killer:
                suspects[name]['probability'] = update_probability(
                    suspects[name], get_suspect_clues(suspects[name]), suspects[name]['lie_probability']
                )
        tries -= 1

if tries == 0:
    print("\n💀 You've used all your guesses!")
    print(f"The killer was {killer_name} using the {killer_weapon}.")

game_end_time = time.time()
elapsed_time = game_end_time - game_start_time
minutes, seconds = divmod(int(elapsed_time), 60)
print(f"\n⏱️ Total time taken: {minutes} minutes and {seconds} seconds.")

from flask import Flask, jsonify, request, redirect
from flask_pymongo import PyMongo
app = Flask(__name__)
app.config["MONGO_URI"] = app.config["MONGO_URI"] = "mongodb+srv://k224543:AIProject@cluster0.ax1gaes.mongodb.net/oblivion?retryWrites=true&w=majority&appName=Cluster0"

mongo = PyMongo(app)
#All the routings in our app will be mentioned here.
@app.route('/add_user', methods=['POST'])
def add_user():
    user_data = request.json 
    mongo.db.users.insert_one(user_data)
    return jsonify(message="User added successfully"), 201

@app.route('/submit_score', methods=['POST'])
def submit_score():
    data = request.json

    # Validate keys
    if not data or 'username' not in data or 'time' not in data or 'tries' not in data:
        return jsonify({"error": "Invalid data. 'username', 'time', and 'tries' are required."}), 400

    # Extract time string like "0 minutes and 34 seconds"
    time_string = data["time"]

    # Parse time into total seconds using regex
    match = re.match(r"(?:(\d+)\s*minutes?)?\s*(?:and\s*)?(?:(\d+)\s*seconds?)?", time_string)
    if not match:
        return jsonify({"error": "Invalid time format."}), 400

    minutes = int(match.group(1)) if match.group(1) else 0
    seconds = int(match.group(2)) if match.group(2) else 0
    total_seconds = minutes * 60 + seconds

    # Calculate score
    score = 1000 - total_seconds - (50 * data["tries"])

    # Check if user exists
    existing_user = mongo.db.users.find_one({"username": data["username"]})

    if existing_user:
        if "score" not in existing_user:
            mongo.db.users.update_one(
                {"username": data["username"]},
                {"$set": {"score": score}}
            )
            return jsonify(message="Score assigned to existing user!"), 200

        if score > existing_user["score"]:
            mongo.db.users.update_one(
                {"username": data["username"]},
                {"$set": {"score": score}}
            )
            return jsonify(message="High score updated!"), 200
        else:
            return jsonify(message="Score not high enough to update."), 200
    else:
        # Save new user
        new_user = {
            "username": data["username"],
            "score": score
        }
        mongo.db.users.insert_one(new_user)
        return jsonify(message="Score saved successfully!"), 201
    

@app.route('/leaderboard', methods=['GET'])
def leaderboard():
    # Fetch top 10 users sorted by score in descending order
    top_scores = mongo.db.users.find().sort("score", -1).limit(10)

    # Convert results into a list of dictionaries
    leaderboard = [{"username": user["username"], "score": user.get("score", 0)} for user in top_scores]

    return jsonify(leaderboard=leaderboard), 200

if __name__ == '__main__':
    app.run(debug=True, port=5001)

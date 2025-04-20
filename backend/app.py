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
    # Check that the incoming data is JSON and parse it
    data = request.json  # Expecting {"username": "Fizza", "score": 90}
    
    # Check if the expected keys are in the request
    if not data or 'username' not in data or 'score' not in data:
        return jsonify({"error": "Invalid data. 'username' and 'score' are required."}), 400
    
    # Find the existing user
    existing_user = mongo.db.users.find_one({"username": data["username"]})

    if existing_user:
        # If the user exists but doesn't have a score, assign the new score
        if "score" not in existing_user:
            mongo.db.users.update_one(
                {"username": data["username"]},
                {"$set": {"score": data["score"]}}
            )
            return jsonify(message="Score assigned to new user!"), 200
        
        # Only update the score if the new score is higher than the old one
        if data["score"] > existing_user["score"]:
            mongo.db.users.update_one(
                {"username": data["username"]},
                {"$set": {"score": data["score"]}}
            )
            return jsonify(message="High score updated!"), 200
        else:
            return jsonify(message="Score not high enough to update."), 200
    else:
        # New user, insert with their score
        mongo.db.users.insert_one(data)
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
from flask import Flask, jsonify, request
from flask_cors import CORS
import re
from pymongo import MongoClient
from datetime import datetime

app = Flask(__name__)

# Configure MongoDB connection (using local MongoDB instance)
MONGO_URI = "mongodb+srv://zayyscodes:helloworld4219@aiproject.bxmeloz.mongodb.net/"
client = MongoClient(MONGO_URI)
db = client["aiproject"]

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# Define schema validation for the 'users' collection
def setup_users_collection():
    # Check if the 'users' collection exists, create it with validation if it doesn't
    if "users" not in db.list_collection_names():
        # Define the validation schema
        validator = {
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["username", "score", "time", "tries"],
                "properties": {
                    "username": {
                        "bsonType": "string",
                        "description": "must be a string and is required",
                        "minLength": 1,
                        "maxLength": 50
                    },
                    "score": {
                        "bsonType": "int",
                        "description": "must be an integer and is required",
                        "minimum": -1000,  # Allow negative scores if tries are high
                        "maximum": 1000
                    },
                    "time": {
                        "bsonType": "string",
                        "description": "must be a string in MM:SS format and is required",
                        "pattern": "^[0-5][0-9]:[0-5][0-9]$"  # Regex for MM:SS format
                    },
                    "tries": {
                        "bsonType": "int",
                        "description": "must be an integer and is required",
                        "minimum": 0,
                        "maximum": 10
                    },
                    "created_at": {
                        "bsonType": "date",
                        "description": "must be a date (optional)"
                    }
                }
            }
        }

        # Create the 'users' collection with the validator
        db.create_collection("users", validator=validator)

        # Create a unique index on 'username' to prevent duplicates
        db.users.create_index("username", unique=True)

# Initialize the database and collection
try:
    setup_users_collection()
    print("Successfully initialized 'users' collection with schema validation.")
except Exception as e:
    print(f"Failed to initialize 'users' collection: {str(e)}")

# Routes
@app.route('/add_user', methods=['POST'])
def add_user():
    try:
        user_data = request.json
        if not user_data or 'username' not in user_data:
            return jsonify({"status": "error", "message": "Username is required"}), 400

        # Add created_at timestamp
        user_data["created_at"] = datetime.utcnow()

        # Insert the user (schema validation will ensure the document is correct)
        db.users.insert_one(user_data)
        return jsonify({"status": "success", "message": "User added successfully"}), 201
    except Exception as e:
        if "duplicate key error" in str(e):
            return jsonify({"status": "error", "message": "Username already exists"}), 400
        return jsonify({"status": "error", "message": f"Failed to add user: {str(e)}"}), 500

@app.route('/submit_score', methods=['POST'])
def submit_score():
    try:
        data = request.json
        # Validate keys
        required_keys = ['username', 'time', 'tries']
        if not data or not all(key in data for key in required_keys):
            return jsonify({"status": "error", "message": f"Missing required fields: {', '.join(required_keys)}"}), 400

        # Parse time in MM:SS format (e.g., "03:45")
        time_string = data["time"]
        match = re.match(r"(\d{2}):(\d{2})", time_string)
        if not match:
            return jsonify({"status": "error", "message": "Invalid time format. Expected MM:SS (e.g., '03:45')"}), 400

        minutes, seconds = map(int, match.groups())
        total_seconds = minutes * 60 + seconds

        # Validate tries
        tries = int(data["tries"])
        if tries < 0:
            return jsonify({"status": "error", "message": "Tries cannot be negative"}), 400

        # Calculate score
        score = 1000 - total_seconds - (50 * tries)

        # Check if user exists
        existing_user = db.users.find_one({"username": data["username"]})
        if existing_user:
            if "score" not in existing_user or score > existing_user["score"]:
                db.users.update_one(
                    {"username": data["username"]},
                    {"$set": {"score": score, "time": time_string, "tries": tries, "created_at": datetime.utcnow()}}
                )
                return jsonify({"status": "success", "message": "High score updated!"}), 200
            return jsonify({"status": "success", "message": "Score not high enough to update."}), 200
        else:
            # Save new user
            new_user = {
                "username": data["username"],
                "score": score,
                "time": time_string,
                "tries": tries,
                "created_at": datetime.utcnow()
            }
            db.users.insert_one(new_user)
            return jsonify({"status": "success", "message": "Score saved successfully!"}), 201
    except Exception as e:
        if "duplicate key error" in str(e):
            return jsonify({"status": "error", "message": "Username already exists"}), 400
        if "document failed validation" in str(e):
            return jsonify({"status": "error", "message": "Invalid data format. Ensure all fields meet schema requirements."}), 400
        return jsonify({"status": "error", "message": f"Failed to submit score: {str(e)}"}), 500

@app.route('/leaderboard', methods=['GET'])
def leaderboard():
    try:
        # Fetch top 10 users sorted by score in descending order
        top_scores = db.users.find().sort("score", -1).limit(10)
        leaderboard = [
            {
                "username": user["username"],
                "score": user.get("score", 0),
                "time": user.get("time", "N/A"),
                "tries": user.get("tries", 0)
            }
            for user in top_scores
        ]
        return jsonify({"status": "success", "leaderboard": leaderboard}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to fetch leaderboard: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
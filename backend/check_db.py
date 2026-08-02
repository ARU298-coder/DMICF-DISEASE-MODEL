import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load connection string from .env
load_dotenv()
MONGO_URI = os.getenv("")

client = MongoClient(MONGO_URI)
db = client.medipredict
users_collection = db.users

# Fetch all users
users = users_collection.find()

print("--- Users in Database ---")
for user in users:
    print(user)

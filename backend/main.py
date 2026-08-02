from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os
import re
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="Symptom Prediction API")

# Configure CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Models
MODEL_PATH = "models/rf_model.pkl"
SYMPTOMS_PATH = "models/symptoms_list.pkl"
INFO_PATH = "models/disease_info.pkl"
SEVERITY_PATH = "models/severity_map.pkl"

if not os.path.exists(MODEL_PATH):
    raise RuntimeError("Model files not found. Run train_model.py first.")

rf_model = joblib.load(MODEL_PATH)
all_symptoms = joblib.load(SYMPTOMS_PATH)
disease_info = joblib.load(INFO_PATH)

# Load severity weights (fall back to binary if file doesn't exist)
if os.path.exists(SEVERITY_PATH):
    severity_map = joblib.load(SEVERITY_PATH)
else:
    severity_map = {}

def clean_symptom(s):
    """Normalize symptom strings to match training format."""
    if not s:
        return ""
    s = str(s).strip().lower()
    s = re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r'\s*_\s*', '_', s)
    return s

class PredictionRequest(BaseModel):
    symptoms: list[str]

class UserRequest(BaseModel):
    name: str
    age: str
    gender: str
    contact: str

MONGO_URI = os.getenv("MONGODB_URI")
if MONGO_URI:
    try:
        mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        mongo_client.admin.command('ping')
        db = mongo_client.medipredict
        users_collection = db.users
        print("Connected to MongoDB successfully.")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        users_collection = None
else:
    users_collection = None

@app.post("/save_user")
def save_user(user: UserRequest):
    if users_collection is not None:
        try:
            user_data = {
                "name": user.name,
                "age": user.age,
                "gender": user.gender,
                "contact": user.contact
            }
            users_collection.insert_one(user_data)
        except Exception as e:
            print(f"Failed to insert to MongoDB: {e}")
            raise HTTPException(status_code=500, detail="Database Error")
    else:
        user_data = {
            "Name": [user.name],
            "Age": [user.age],
            "Gender": [user.gender],
            "Contact": [user.contact]
        }

        df = pd.DataFrame(user_data)
        file_name = "users.xlsx"

        # Append if file exists
        if os.path.exists(file_name):
            existing_df = pd.read_excel(file_name)
            updated_df = pd.concat([existing_df, df], ignore_index=True)
            updated_df.to_excel(file_name, index=False)
        else:
            df.to_excel(file_name, index=False)

    return {"message": "User details saved successfully"}

@app.get("/symptoms")
def get_symptoms():
    """Return a list of all available symptoms for the frontend dropdown."""
    return {"symptoms": all_symptoms}

@app.post("/predict")
def predict_disease(request: PredictionRequest):
    if not request.symptoms:
        raise HTTPException(status_code=400, detail="No symptoms provided.")

    # Create feature vector with severity weights
    X = np.zeros((1, len(all_symptoms)))
    
    matched_symptoms = 0
    for symptom in request.symptoms:
        symptom_clean = clean_symptom(symptom)
        if symptom_clean in all_symptoms:
            idx = all_symptoms.index(symptom_clean)
            # Use severity weight to match training data
            weight = severity_map.get(symptom_clean, 1)
            X[0, idx] = weight
            matched_symptoms += 1

    if matched_symptoms == 0:
        raise HTTPException(status_code=400, detail="None of the provided symptoms were recognized.")

    # Predict probabilities
    probabilities = rf_model.predict_proba(X)[0]
    classes = rf_model.classes_
    
    # Create a list of (disease, probability) and sort descending
    prob_list = list(zip(classes, probabilities))
    prob_list.sort(key=lambda x: x[1], reverse=True)
    
    # Get top 3
    top_3 = prob_list[:3]
    
    results = []
    for disease, prob in top_3:
        description = disease_info['descriptions'].get(disease, "No description available.")
        precautions = disease_info['precautions'].get(disease, [])
        results.append({
            "disease": disease,
            "probability": float(prob),
            "description": description,
            "precautions": precautions
        })

    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

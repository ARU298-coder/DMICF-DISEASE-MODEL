import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os
import re

print("=" * 60)
print("  MediPredict AI — Model Training Pipeline")
print("=" * 60)

# ──────────────────────────────────────────────
# 1. Load datasets
# ──────────────────────────────────────────────
print("\n[1/6] Loading datasets...")
df = pd.read_csv('data/dataset.csv')
severity_df = pd.read_csv('data/Symptom-severity.csv')

print(f"  Dataset shape: {df.shape}")
print(f"  Severity entries: {len(severity_df)}")

# ──────────────────────────────────────────────
# 2. Clean symptom strings
# ──────────────────────────────────────────────
print("\n[2/6] Cleaning symptom strings...")

def clean_symptom(s):
    """Normalize symptom strings: strip, lowercase, collapse multiple spaces/underscores."""
    if pd.isna(s):
        return None
    s = str(s).strip().lower()
    # Collapse multiple spaces into one, then replace spaces with underscores
    s = re.sub(r'\s+', ' ', s).strip()
    # Normalize underscores: remove spaces around underscores
    s = re.sub(r'\s*_\s*', '_', s)
    return s

# Clean severity data
severity_df['Symptom'] = severity_df['Symptom'].apply(clean_symptom)
severity_map = dict(zip(severity_df['Symptom'], severity_df['weight']))
print(f"  Loaded {len(severity_map)} symptom severity weights")

# Get all symptom columns
symptom_cols = [col for col in df.columns if col.startswith('Symptom')]

# Clean all symptom values in the dataset
for col in symptom_cols:
    df[col] = df[col].apply(clean_symptom)

# Clean disease names (fix known typos)
disease_name_fixes = {
    'Peptic ulcer diseae': 'Peptic ulcer disease',
    'Osteoarthristis': 'Osteoarthritis',
    'Dimorphic hemmorhoids(piles)': 'Dimorphic hemorrhoids (piles)',
    '(vertigo) Paroymsal  Positional Vertigo': 'Paroxysmal Positional Vertigo',
    'hepatitis A': 'Hepatitis A',  # Capitalize consistently
}
df['Disease'] = df['Disease'].replace(disease_name_fixes)

# Collect all unique cleaned symptoms
all_symptoms = []
for col in symptom_cols:
    all_symptoms.extend(df[col].dropna().unique().tolist())
all_symptoms = sorted(set(all_symptoms))
print(f"  Found {len(all_symptoms)} unique symptoms after cleaning")

# Check for symptoms missing severity weights
missing_severity = [s for s in all_symptoms if s not in severity_map]
if missing_severity:
    print(f"  ⚠ {len(missing_severity)} symptoms missing severity weights (will default to 1):")
    for s in missing_severity[:5]:
        print(f"    - {s}")

# ──────────────────────────────────────────────
# 3. Build feature matrix with severity weights
# ──────────────────────────────────────────────
print("\n[3/6] Building feature matrix with severity weights...")

X = np.zeros((len(df), len(all_symptoms)))

for i, row in df.iterrows():
    for col in symptom_cols:
        symptom = row[col]
        if symptom is not None:
            if symptom in all_symptoms:
                idx = all_symptoms.index(symptom)
                # Use severity weight instead of binary 1
                weight = severity_map.get(symptom, 1)
                X[i, idx] = weight

y = df['Disease'].values

print(f"  Feature matrix shape: {X.shape}")
print(f"  Number of classes: {len(np.unique(y))}")

# ──────────────────────────────────────────────
# 4. Train/Test Split
# ──────────────────────────────────────────────
print("\n[4/6] Splitting into train/test sets (80/20)...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"  Training samples: {len(X_train)}")
print(f"  Test samples: {len(X_test)}")

# ──────────────────────────────────────────────
# 5. Train with cross-validation
# ──────────────────────────────────────────────
print("\n[5/6] Training Random Forest with cross-validation...")

rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=None,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features='sqrt',
    random_state=42,
    n_jobs=-1
)

# 5-fold cross-validation on training data
cv_scores = cross_val_score(rf, X_train, y_train, cv=5, scoring='accuracy')
print(f"\n  Cross-Validation Results (5-fold):")
print(f"    Mean Accuracy: {cv_scores.mean():.4f}")
print(f"    Std Deviation: {cv_scores.std():.4f}")
print(f"    Fold Scores:   {[f'{s:.4f}' for s in cv_scores]}")

# Train final model on full training set
rf.fit(X_train, y_train)

# ──────────────────────────────────────────────
# 6. Evaluate on test set
# ──────────────────────────────────────────────
print("\n[6/6] Evaluating on test set...")

y_pred = rf.predict(X_test)
test_accuracy = accuracy_score(y_test, y_pred)

print(f"\n  Test Set Accuracy: {test_accuracy:.4f} ({test_accuracy*100:.1f}%)")
print(f"\n  Classification Report:")
print(classification_report(y_test, y_pred))

# ──────────────────────────────────────────────
# Save model and artifacts
# ──────────────────────────────────────────────
print("Saving model and artifacts...")
os.makedirs('models', exist_ok=True)
joblib.dump(rf, 'models/rf_model.pkl')
joblib.dump(all_symptoms, 'models/symptoms_list.pkl')
joblib.dump(severity_map, 'models/severity_map.pkl')

# Parse symptom descriptions and precautions
desc_df = pd.read_csv('data/symptom_Description.csv')
prec_df = pd.read_csv('data/symptom_precaution.csv')

# Apply the same disease name fixes to description/precaution data
desc_df['Disease'] = desc_df['Disease'].replace(disease_name_fixes)
prec_df['Disease'] = prec_df['Disease'].replace(disease_name_fixes)

descriptions = dict(zip(desc_df['Disease'], desc_df['Description']))
precautions = {}
for i, row in prec_df.iterrows():
    disease = row['Disease']
    precs = [row[col] for col in prec_df.columns if col.startswith('Precaution') and pd.notna(row[col])]
    precautions[disease] = precs

joblib.dump({'descriptions': descriptions, 'precautions': precautions}, 'models/disease_info.pkl')

print("\n" + "=" * 60)
print("  ✓ Training completed successfully!")
print(f"  ✓ Model accuracy: {test_accuracy*100:.1f}%")
print(f"  ✓ Files saved to models/")
print("=" * 60)

#
# File: train.py
#
# This script trains our v1 XGBoost model on the data
# we just generated. It saves the trained model to a file.
#

import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
import joblib # Used to save the model

print("Starting model training...")

# 1. Load the dataset
try:
    df = pd.read_csv('training_data.csv')
except FileNotFoundError:
    print("ERROR: 'training_data.csv' not found.")
    print("Please run 'python3 generate_dataset.py' first.")
    exit()

# 2. Define our Features (X) and Target (y)
# These are the *exact* features our API will receive.
features = [
    'hr',
    'spo2',
    'skinTemp',
    'ambientGasPpm',
    'zoneTemp',
    'ppeCompliant',
    'shiftDurationHours',
    'pastIncidentCount',
    'age'
]

target = 'accident_occurred'

X = df[features]
y = df[target]

# 3. Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"Training model on {len(X_train)} samples...")

# 4. Initialize and Train the XGBoost Classifier
# We use a simple model. Perfect for a hackathon.
model = XGBClassifier(
    objective='binary:logistic',
    use_label_encoder=False,
    eval_metric='logloss',
    n_estimators=100, # 100 "trees"
    max_depth=3,      # Keep it simple
    learning_rate=0.1
)

model.fit(X_train, y_train)

# 5. Check accuracy on the test set
accuracy = model.score(X_test, y_test)
print(f"Model trained. Test Accuracy: {accuracy * 100:.2f}%")

# 6. Save the trained model to a file
model_filename = 'xgboost_model.pkl'
joblib.dump(model, model_filename)

print(f"Model successfully saved to '{model_filename}'")
print("---")
print("TRAINING COMPLETE")
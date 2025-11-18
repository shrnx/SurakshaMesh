#
# File: generate_dataset.py
#
# This script generates a realistic, FAKE training dataset
# because the Kaggle dataset's features do not match our
# real-time sensor inputs. This is the correct way.
#

import pandas as pd
import numpy as np

NUM_ROWS = 10000

print(f"Generating {NUM_ROWS} mock training rows...")

# Simulate our features
data = {
    # Worker Vitals (from Badge)
    'hr': np.random.normal(loc=90, scale=20, size=NUM_ROWS).astype(int),
    'spo2': np.random.normal(loc=97, scale=2, size=NUM_ROWS).astype(int),
    'skinTemp': np.random.normal(loc=37.5, scale=1.5, size=NUM_ROWS),

    # Environmental (from SCADA)
    'ambientGasPpm': np.random.normal(loc=30, scale=15, size=NUM_ROWS).astype(int),
    'zoneTemp': np.random.normal(loc=35, scale=10, size=NUM_ROWS).astype(int),

    # PPE (from Vision)
    'ppeCompliant': np.random.choice([0, 1], size=NUM_ROWS, p=[0.2, 0.8]), # 0=no, 1=yes

    # Worker Profile
    'shiftDurationHours': np.random.uniform(low=0.1, high=12.0, size=NUM_ROWS),
    'pastIncidentCount': np.random.choice([0, 1, 2, 3, 4, 5], size=NUM_ROWS, p=[0.5, 0.2, 0.15, 0.1, 0.03, 0.02]),
    'age': np.random.randint(low=20, high=65, size=NUM_ROWS)
}

df = pd.DataFrame(data)

# --- This is our "Target Variable" ---
# We are creating the "accident_occurred" column (0 = no, 1 = yes)
# This is the "answer" the model needs to learn.

# We will "engineer" this answer to be logical.
# Accidents are more likely if:
# - HR is high (>110)
# - Gas is high (>50)
# - PPE is missing (==0)
# - Shift is long (>8)

accident_prob = np.zeros(NUM_ROWS)

# Add risk factors
accident_prob += (df['hr'] > 110) * 0.3
accident_prob += (df['ambientGasPpm'] > 50) * 0.4
accident_prob += (df['ppeCompliant'] == 0) * 0.2
accident_prob += (df['shiftDurationHours'] > 8) * 0.1

# Add random noise so it's not perfectly predictable
accident_prob += np.random.uniform(low=0, high=0.1, size=NUM_ROWS)

# Create the final binary target
# We'll set a threshold. Any probability > 0.45 counts as an accident.
df['accident_occurred'] = (accident_prob > 0.45).astype(int)

# Clean up any impossible values
df['hr'] = np.clip(df['hr'], 60, 180)
df['ambientGasPpm'] = np.clip(df['ambientGasPpm'], 0, 200)
df['spo2'] = np.clip(df['spo2'], 90, 100)

# Save to disk
df.to_csv('training_data.csv', index=False)

print("---")
print("Generated 'training_data.csv' successfully.")
print("Here is what the data looks like:")
print(df.head())
print("---")
print("Accident counts:")
print(df['accident_occurred'].value_counts())
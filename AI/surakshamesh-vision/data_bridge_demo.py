#
# File: data_bridge_demo.py (v8.0 - FIXED 400 ERROR)
#
import cv2
import numpy as np
from ultralytics import YOLO
import json
import time
import requests 


# --- 1. CONFIGURATION ---
GURU_BACKEND_URL = "https://5aea8b61971b.ngrok-free.app" 
# ---------------------------------


# --- GLOBAL FLAG FOR SOS ---
global_sos_active = False
# -----------------------------


class SurakshaMeshBridge:
    def __init__(self):
        # --- Model Setup ---
        try:
            self.model = YOLO("bestn.pt")
            self.class_names = self.model.names
            print(f"Successfully loaded 'bestn.pt'. Model classes: {self.class_names}")
        except Exception as e:
            print(f"--- FATAL ERROR: 'bestn.pt' NOT FOUND --- {e}")
            exit()
            
        self.confidence_threshold = 0.4 
        self.required_ppe = ['hardhat', 'vest']
        self.all_ppe_classes = ['gloves', 'hardhat', 'safety glasses', 'vest']

        # --- Webcam Setup ---
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            print("Error: Unable to access the webcam.")
            exit()

        cv2.namedWindow("SurakshaMesh X - LIVE DATA BRIDGE", cv2.WINDOW_NORMAL)
        cv2.setWindowProperty("SurakshaMesh X - LIVE DATA BRIDGE", cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

        # --- Data Bridge Timer ---
        self.last_send_time = time.time()
        self.send_interval = 10


    def run(self):
        global global_sos_active
        
        while True:
            ret, frame = self.cap.read()
            if not ret: break

            # --- 1. YOLOv8 Inference ---
            results = self.model(frame, conf=self.confidence_threshold, iou=0.3, verbose=False)

            # --- 2. Get Mock Badge Data (determines workerId) ---
            badge_telemetry = self.get_mock_badge_data(None, global_sos_active)
            worker_id = badge_telemetry["workerId"]
            
            # --- 3. Data Extraction (use same workerId) ---
            all_found_items, vision_telemetry = self.get_vision_telemetry(results, worker_id)
            
            # --- 4. Update badge data based on vision compliance ---
            badge_telemetry = self.get_mock_badge_data(vision_telemetry, global_sos_active)

            # --- 5. Send Data to Backend (Every 2s) ---
            current_time = time.time()
            if (current_time - self.last_send_time) > self.send_interval:
                self.send_data_to_backend(vision_telemetry, badge_telemetry)
                self.last_send_time = current_time
                if global_sos_active:
                    print(">>> SOS Signal Sent! Resetting flag. <<<")
                    global_sos_active = False

            # --- 6. Visualization ---
            annotated_frame = results[0].plot()
            annotated_frame = self.draw_hud(annotated_frame, vision_telemetry)
            cv2.imshow("SurakshaMesh X - LIVE DATA BRIDGE", annotated_frame)

            # --- 7. Exit & SOS Key Listener ---
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'): break
            if key == ord('s'):
                print("\n*** SOS KEY PRESSED! (SIMULATING LORA MESH) ***")
                global_sos_active = True

        self.cap.release()
        cv2.destroyAllWindows()


    def get_vision_telemetry(self, results, worker_id="EMP-107"):
        """
        Extract PPE compliance data with proper backend format
        """
        hardhat_count = 0
        vest_count = 0
        all_found_items = []
        
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            label = self.class_names[cls_id]
            all_found_items.append(label)
            if label == 'hardhat': hardhat_count += 1
            elif label == 'vest': vest_count += 1
        
        is_compliant = (hardhat_count > 0) and (vest_count > 0)
        if len(all_found_items) == 0:
            is_compliant = True
            
        missing_items = []
        if hardhat_count == 0: missing_items.append("hardhat")
        if vest_count == 0: missing_items.append("vest")
            
        # FIXED: Add workerId and timestamp (backend requires these)
        telemetry_payload = {
            "workerId": worker_id,  # Match badge telemetry
            "timestamp": time.time(),  # Standard telemetry field
            "isCompliant": is_compliant,
            "missingItems": missing_items if not is_compliant else [],
            "allFoundItems": list(set(all_found_items))
        }
        return all_found_items, telemetry_payload


    def get_mock_badge_data(self, vision_data, sos_pressed):
        """Generate mock badge sensor data"""
        if sos_pressed:
            return {
                "workerId": "EMP-104",
                "hr": 150,
                "spo2": 95,
                "skinTemp": 38.0,
                "location": {"x": 120, "y": 80},
                "fallDetected": False,
                "sosActive": True
            }
        
        if vision_data and not vision_data["isCompliant"]:
            return {
                "workerId": "EMP-104",
                "hr": 115,
                "spo2": 96,
                "skinTemp": 38.2,
                "location": {"x": 120, "y": 80},
                "fallDetected": False,
                "sosActive": False
            }
        else:
            return {
                "workerId": "EMP-107",
                "hr": 72,
                "spo2": 99,
                "skinTemp": 36.5,
                "location": {"x": 10, "y": 15},
                "fallDetected": False,
                "sosActive": False
            }


    def send_data_to_backend(self, vision_data, badge_data):
        """Send telemetry to Guru's backend"""
        print(f"\n--- Sending Data (Every {self.send_interval}s) ---")
        
        # Send Vision Data
        try:
            vision_url = f"{GURU_BACKEND_URL}/telemetry/vision"
            res_vision = requests.post(vision_url, json=vision_data, timeout=1.0)
            
            if res_vision.status_code in [200, 202]:
                print(f"✅ VISION POST {vision_url} -> [Code: {res_vision.status_code}]")
            else:
                print(f"⚠️ VISION POST {vision_url} -> [Code: {res_vision.status_code}]")
                print(f"   Response: {res_vision.text}")
                
            print(f"   Sent: {json.dumps(vision_data)}")
        except Exception as e:
            print(f"❌ ERROR: Could not send vision data - {e}")
        
        # Send Badge Data
        try:
            badge_url = f"{GURU_BACKEND_URL}/telemetry/badge"
            res_badge = requests.post(badge_url, json=badge_data, timeout=1.0)
            
            if res_badge.status_code in [200, 202]:
                print(f"✅ BADGE POST {badge_url} -> [Code: {res_badge.status_code}]")
            else:
                print(f"⚠️ BADGE POST {badge_url} -> [Code: {res_badge.status_code}]")
                
            print(f"   Sent: {json.dumps(badge_data)}")
        except Exception as e:
            print(f"❌ ERROR: Could not send badge data - {e}")
            
        print("------------------------------------------")


    def draw_hud(self, frame, telemetry_data):
        """Draw status HUD on frame"""
        cv2.rectangle(frame, (0, 0), (350, 110), (0, 0, 0), -1) 
        cv2.putText(frame, "SURAKSHAMESH X - LIVE FEED", (10, 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        
        if telemetry_data["isCompliant"]:
            cv2.putText(frame, "STATUS: COMPLIANT", (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        else:
            cv2.putText(frame, "STATUS: NON-COMPLIANT", (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
            cv2.putText(frame, f"Missing: {', '.join(telemetry_data['missingItems'])}", (10, 90),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        
        if global_sos_active:
            cv2.putText(frame, "SOS-RELAY ACTIVE", (30, 150),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 165, 255), 3)
        return frame


if __name__ == '__main__':
    app = SurakshaMeshBridge()
    app.run()
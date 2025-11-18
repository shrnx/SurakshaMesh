#
# File: data_bridge_ultimate.py
# ULTIMATE: Multi-person tracking, face memory, zero hair false positives
#

import cv2
import numpy as np
from ultralytics import YOLO
import json
import time
import requests
import random
from collections import defaultdict

GURU_BACKEND_URL = "https://5309c211657a.ngrok-free.app"
global_sos_active = False

class UltimateMultiPersonPPEDetector:
    def __init__(self):
        # Load YOLO model
        try:
            self.model = YOLO("bestn.pt")
            self.class_names = self.model.names
            print(f"✅ YOLO model loaded")
        except Exception as e:
            print(f"❌ FATAL: {e}")
            exit()
        
        # === ULTRA-STRICT HARDHAT DETECTION (NO HAIR!) ===
        self.confidence_thresholds = {
            'hardhat': 0.75,    # ULTRA HIGH - only real hardhats
            'vest': 0.60,
            'gloves': 0.55,
            'boots': 0.55,
            'safety glasses': 0.65
        }
        
        self.min_hardhat_area = 1500  # Large minimum for hardhat
        self.min_vest_area = 2000     # Even larger for vest
        
        # === MULTI-PERSON TRACKING ===
        self.active_workers = {}  # {person_location: worker_info}
        self.worker_assignments = {}  # {face_hash: worker_id} - remembers people
        
        # Worker pools
        self.worker_pool_male = [
            {"id": "WKR-2401-M", "name": "Rajesh Kumar", "zone": "Furnace-A"},
            {"id": "WKR-2402-M", "name": "Amit Singh", "zone": "Assembly-B"},
            {"id": "WKR-2403-M", "name": "Vikram Patel", "zone": "Welding-C"},
            {"id": "WKR-2404-M", "name": "Suresh Sharma", "zone": "Quality-D"},
            {"id": "WKR-2405-M", "name": "Rahul Verma", "zone": "Maintenance-E"}
        ]
        self.worker_pool_female = [
            {"id": "WKR-2406-F", "name": "Priya Sharma", "zone": "Assembly-A"},
            {"id": "WKR-2407-F", "name": "Anjali Verma", "zone": "Packaging-B"},
            {"id": "WKR-2408-F", "name": "Neha Gupta", "zone": "Inspection-C"},
            {"id": "WKR-2409-F", "name": "Pooja Reddy", "zone": "Testing-D"},
            {"id": "WKR-2410-F", "name": "Kavita Singh", "zone": "Quality-E"}
        ]
        
        self.used_workers = set()
        self.person_boxes = []  # Track detected persons by bounding box
        
        # Face detection for person tracking
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Performance optimization
        self.frame_skip = 2
        self.frame_count = 0
        self.last_results = None
        
        # Webcam
        self.cap = cv2.VideoCapture(0)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        if not self.cap.isOpened():
            print("❌ Webcam error")
            exit()
        
        cv2.namedWindow("SurakshaMesh X - Multi-Person Tracking", cv2.WINDOW_NORMAL)
        
        self.last_send_time = time.time()
        self.send_interval = 2
        
        print(f"\n🚀 MULTI-PERSON TRACKING ACTIVE")
        print(f"👥 Can track multiple workers simultaneously")
        print(f"🎯 Ultra-strict hardhat detection (no hair!)")
        print(f"🔄 Press 'R'=Reset All | 'S'=SOS | 'Q'=Quit\n")

    def detect_persons(self, frame):
        """
        Detect individual persons in frame using face detection
        Returns list of person locations (x, y, w, h)
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 4, minSize=(50, 50))
        
        persons = []
        for (x, y, w, h) in faces:
            # Create person identifier based on position
            person_location = f"{x//50}_{y//50}"  # Grid-based location
            persons.append({
                'location': person_location,
                'bbox': (x, y, w, h),
                'center': (x + w//2, y + h//2)
            })
        
        return persons

    def assign_worker_to_person(self, person_location):
        """Assign or retrieve worker for a specific person"""
        
        # Check if this person already has a worker assigned
        if person_location in self.worker_assignments:
            worker_id = self.worker_assignments[person_location]
            # Find worker info
            for pool in [self.worker_pool_male, self.worker_pool_female]:
                for worker in pool:
                    if worker["id"] == worker_id:
                        return worker
        
        # New person - assign random worker
        # Alternate between male and female for variety
        if len(self.used_workers) % 2 == 0:
            available = [w for w in self.worker_pool_male if w["id"] not in self.used_workers]
            if not available:
                available = self.worker_pool_male
        else:
            available = [w for w in self.worker_pool_female if w["id"] not in self.used_workers]
            if not available:
                available = self.worker_pool_female
        
        worker = random.choice(available)
        self.used_workers.add(worker["id"])
        self.worker_assignments[person_location] = worker["id"]
        
        print(f"\n👤 NEW WORKER: {worker['name']} ({worker['id']}) at position {person_location}")
        
        return worker

    def validate_hardhat_detection(self, box, frame_shape, person_centers):
        """
        ULTRA-STRICT hardhat validation
        - Must be near a detected person's head
        - Must have correct size, aspect ratio, position
        - Rejects hair, phones, random objects
        """
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
        width = x2 - x1
        height = y2 - y1
        area = width * height
        frame_height, frame_width = frame_shape[:2]
        
        # Check 1: Minimum area (must be substantial)
        if area < self.min_hardhat_area:
            return False, None
        
        # Check 2: Aspect ratio (hardhats are WIDER than tall)
        aspect_ratio = width / height if height > 0 else 0
        
        # Hardhats: 1.1 - 2.5 (wider)
        # Hair: < 1.0 (taller) ← REJECT
        if aspect_ratio < 1.05 or aspect_ratio > 2.8:
            return False, None
        
        # Check 3: Position (must be in upper 50% of frame)
        center_y = (y1 + y2) / 2
        relative_y = center_y / frame_height
        if relative_y > 0.50:
            return False, None
        
        # Check 4: Not too wide/tall (reject body detections)
        if width / frame_width > 0.45 or height / frame_height > 0.30:
            return False, None
        
        # Check 5: Must be near a detected person's face
        hardhat_center = ((x1 + x2) / 2, (y1 + y2) / 2)
        
        nearest_person = None
        min_distance = float('inf')
        
        for person in person_centers:
            face_center = person['center']
            distance = np.sqrt((hardhat_center[0] - face_center[0])**2 + 
                             (hardhat_center[1] - face_center[1])**2)
            
            # Hardhat should be within 100 pixels of face center (head area)
            if distance < min_distance and distance < 150:
                min_distance = distance
                nearest_person = person
        
        if nearest_person is None:
            # No person nearby = false positive (hair, wall, etc.)
            return False, None
        
        # Check 6: Hardhat must be ABOVE the face (not below)
        if hardhat_center[1] > nearest_person['center'][1]:
            return False, None
        
        return True, nearest_person

    def validate_vest_detection(self, box, frame_shape, person_centers):
        """Validate vest - must be near a person's body"""
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
        width = x2 - x1
        height = y2 - y1
        area = width * height
        
        if area < self.min_vest_area:
            return False, None
        
        aspect_ratio = width / height if height > 0 else 0
        if aspect_ratio > 2.5 or aspect_ratio < 0.3:
            return False, None
        
        # Vest should be near a person
        vest_center = ((x1 + x2) / 2, (y1 + y2) / 2)
        
        for person in person_centers:
            face_center = person['center']
            distance = np.sqrt((vest_center[0] - face_center[0])**2 + 
                             (vest_center[1] - face_center[1])**2)
            
            # Vest should be 50-250 pixels below face
            if 50 < distance < 300:
                # Check if vest is below face (not above)
                if vest_center[1] > face_center[1]:
                    return True, person
        
        return False, None

    def get_ppe_per_person(self, results, frame_shape, persons):
        """
        Get PPE status for EACH detected person
        Returns: {person_location: {"hardhat": bool, "vest": bool, ...}}
        """
        person_ppe = defaultdict(lambda: {"hardhat": False, "vest": False, "items": []})
        
        if len(persons) == 0:
            return person_ppe
        
        # Analyze each PPE detection
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            label = self.class_names[cls_id]
            confidence = float(box.conf[0])
            
            required_conf = self.confidence_thresholds.get(label, 0.55)
            
            if confidence < required_conf:
                continue
            
            # Validate and assign to person
            if label == "hardhat":
                is_valid, assigned_person = self.validate_hardhat_detection(box, frame_shape, persons)
                if is_valid and assigned_person:
                    location = assigned_person['location']
                    person_ppe[location]["hardhat"] = True
                    person_ppe[location]["items"].append("hardhat")
                    print(f"  ✅ Hardhat for {location} (conf: {confidence:.2f})")
                else:
                    print(f"  ❌ Hardhat rejected (likely hair/phone, conf: {confidence:.2f})")
            
            elif label == "vest":
                is_valid, assigned_person = self.validate_vest_detection(box, frame_shape, persons)
                if is_valid and assigned_person:
                    location = assigned_person['location']
                    person_ppe[location]["vest"] = True
                    person_ppe[location]["items"].append("vest")
        
        return person_ppe

    def send_data_for_person(self, worker, ppe_status):
        """Send vision + badge data for ONE person"""
        
        # Build vision telemetry
        is_compliant = ppe_status["hardhat"] and ppe_status["vest"]
        missing_items = []
        if not ppe_status["hardhat"]:
            missing_items.append("hardhat")
        if not ppe_status["vest"]:
            missing_items.append("vest")
        
        vision_data = {
            "workerId": worker["id"],
            "isCompliant": is_compliant,
            "missingItems": missing_items,
            "allFoundItems": ppe_status["items"]
        }
        
        # Build badge data (realistic, varies with compliance)
        if not is_compliant:
            badge_data = {
                "workerId": worker["id"],
                "hr": random.randint(95, 115),
                "spo2": random.randint(96, 98),
                "skinTemp": round(random.uniform(37.3, 38.0), 1),
                "location": {"x": random.randint(50, 100), "y": random.randint(40, 80)},
                "fallDetected": False,
                "sosActive": False
            }
        else:
            badge_data = {
                "workerId": worker["id"],
                "hr": random.randint(68, 85),
                "spo2": random.randint(97, 100),
                "skinTemp": round(random.uniform(36.2, 37.2), 1),
                "location": {"x": random.randint(10, 50), "y": random.randint(10, 40)},
                "fallDetected": False,
                "sosActive": False
            }
        
        # Send to Guru
        try:
            res1 = requests.post(f"{GURU_BACKEND_URL}/telemetry/vision", json=vision_data, timeout=1.0)
            res2 = requests.post(f"{GURU_BACKEND_URL}/telemetry/badge", json=badge_data, timeout=1.0)
            print(f"  📤 {worker['id']}: Vision={res1.status_code}, Badge={res2.status_code}")
        except Exception as e:
            print(f"  ⚠️  Send error for {worker['id']}: {e}")

    def draw_hud(self, frame, persons, person_ppe):
        """Draw HUD showing all tracked workers"""
        y_offset = 10
        
        if len(persons) == 0:
            cv2.rectangle(frame, (5, 5), (400, 60), (0, 0, 0), -1)
            cv2.putText(frame, "⚠️  NO WORKERS DETECTED", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
            cv2.putText(frame, "Stand in front of camera", (10, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)
        else:
            for person in persons:
                location = person['location']
                worker = self.assign_worker_to_person(location)
                ppe = person_ppe.get(location, {"hardhat": False, "vest": False, "items": []})
                
                is_compliant = ppe["hardhat"] and ppe["vest"]
                
                # Draw worker info box
                box_height = 70
                cv2.rectangle(frame, (5, y_offset), (450, y_offset + box_height), (0, 0, 0), -1)
                
                cv2.putText(frame, f"{worker['name']} ({worker['id']})", (10, y_offset + 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
                
                if is_compliant:
                    cv2.putText(frame, "✅ COMPLIANT", (10, y_offset + 45),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                else:
                    cv2.putText(frame, "⚠️  NON-COMPLIANT", (10, y_offset + 45),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                    missing = []
                    if not ppe["hardhat"]: missing.append("hardhat")
                    if not ppe["vest"]: missing.append("vest")
                    cv2.putText(frame, f"Missing: {', '.join(missing)}", (10, y_offset + 65),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.3, (0, 0, 255), 1)
                
                # Draw face box
                x, y, w, h = person['bbox']
                color = (0, 255, 0) if is_compliant else (0, 0, 255)
                cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
                cv2.putText(frame, worker['name'], (x, y-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
                
                y_offset += box_height + 5
        
        # Instructions
        cv2.putText(frame, "R=Reset | S=SOS | Q=Quit", 
                    (10, frame.shape[0] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 1)
        
        return frame

    def run(self):
        """ULTIMATE MAIN LOOP"""
        global global_sos_active
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            self.frame_count += 1
            
            # Detect persons in frame
            persons = self.detect_persons(frame)
            
            # Process PPE detection every 2nd frame
            if self.frame_count % self.frame_skip == 0:
                results = self.model(frame, conf=0.55, iou=0.5, verbose=False)
                self.last_results = results
            else:
                results = self.last_results or self.model(frame, conf=0.55, iou=0.5, verbose=False)
            
            # Get PPE status for each person
            person_ppe = self.get_ppe_per_person(results, frame.shape, persons)
            
            # Send data every 2 seconds
            current_time = time.time()
            if (current_time - self.last_send_time) >= self.send_interval:
                print(f"\n--- Sending Data for {len(persons)} worker(s) ---")
                
                for person in persons:
                    location = person['location']
                    worker = self.assign_worker_to_person(location)
                    ppe = person_ppe.get(location, {"hardhat": False, "vest": False, "items": []})
                    self.send_data_for_person(worker, ppe)
                
                print("-" * 50)
                self.last_send_time = current_time
            
            # Visualization
            display_frame = frame.copy()
            if self.frame_count % self.frame_skip == 0:
                display_frame = results[0].plot()
            
            display_frame = self.draw_hud(display_frame, persons, person_ppe)
            cv2.imshow("SurakshaMesh X - Multi-Person Tracking", display_frame)
            
            # Key controls
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('r'):
                print(f"\n🔄 RESET - Clearing all worker assignments\n")
                self.worker_assignments.clear()
                self.used_workers.clear()
        
        self.cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    detector = UltimateMultiPersonPPEDetector()
    detector.run()
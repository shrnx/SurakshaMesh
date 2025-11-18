/*
 * SurakshaMesh X - Safety Badge Simulator
 * ESP32 with LEDs showing real-time risk levels
 */

// LED Pins (Risk Indicators)
#define LED_GREEN   2   // Low Risk (0-30%)
#define LED_YELLOW  4   // Medium Risk (30-60%)
#define LED_RED     5   // High Risk (60-80%)
#define LED_BLINK   18  // Critical Risk (80-100%)

// Buzzer and Button
#define BUZZER_PIN  19
#define SOS_BUTTON  21

// Worker State
int currentRisk = 15;
bool sosActive = false;
unsigned long lastUpdate = 0;

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_BLINK, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(SOS_BUTTON, INPUT_PULLUP);
  
  // Startup animation
  startupAnimation();
  
  Serial.println("\n╔═══════════════════════════════════╗");
  Serial.println("║  SurakshaMesh X Badge Simulator  ║");
  Serial.println("╚═══════════════════════════════════╝");
  Serial.println("Worker ID: WKR-2401-M");
  Serial.println("Zone: Furnace-A");
  Serial.println("Status: ACTIVE\n");
}

void loop() {
  // Check SOS button
  if (digitalRead(SOS_BUTTON) == LOW) {
    triggerSOS();
    delay(300);
  }
  
  // Simulate risk changes every 2 seconds
  if (millis() - lastUpdate >= 2000) {
    simulateRisk();
    lastUpdate = millis();
  }
  
  // Update LED display
  updateRiskDisplay(currentRisk);
  
  delay(100);
}

void simulateRisk() {
  static int targetRisk = 15;
  
  // Gradually drift toward target
  if (currentRisk < targetRisk) {
    currentRisk += random(2, 6);
  } else if (currentRisk > targetRisk) {
    currentRisk -= random(2, 6);
  }
  
  // Occasionally change target (simulate scenarios)
  if (random(100) < 10) {
    int scenario = random(4);
    if (scenario == 0) {
      targetRisk = random(10, 30);  // Normal
      Serial.println("📊 Scenario: NORMAL OPERATION");
    } else if (scenario == 1) {
      targetRisk = random(40, 60);  // Warning
      Serial.println("⚠️  Scenario: ELEVATED STRESS");
    } else if (scenario == 2) {
      targetRisk = random(65, 80);  // Danger
      Serial.println("🚨 Scenario: HIGH RISK");
    } else {
      targetRisk = random(85, 98);  // Critical
      Serial.println("🔴 Scenario: CRITICAL DANGER");
    }
  }
  
  currentRisk = constrain(currentRisk, 0, 100);
  
  // Print status
  Serial.print("Risk: ");
  Serial.print(currentRisk);
  Serial.print("% ");
  
  if (currentRisk < 30) {
    Serial.println("[SAFE ✓]");
  } else if (currentRisk < 60) {
    Serial.println("[WARNING ⚠]");
  } else if (currentRisk < 80) {
    Serial.println("[DANGER 🚨]");
  } else {
    Serial.println("[CRITICAL 🔴]");
  }
}

void updateRiskDisplay(int risk) {
  // Turn off all LEDs
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_BLINK, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  
  if (sosActive) {
    blinkAllRed();
    return;
  }
  
  // Normal Risk Display
  if (risk < 30) {
    // LOW RISK - Green
    digitalWrite(LED_GREEN, HIGH);
  } 
  else if (risk < 60) {
    // MEDIUM RISK - Yellow
    digitalWrite(LED_YELLOW, HIGH);
  } 
  else if (risk < 80) {
    // HIGH RISK - Red (solid)
    digitalWrite(LED_RED, HIGH);
  } 
  else {
    // CRITICAL - Red blinking + buzzer
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 250) {
      digitalWrite(LED_BLINK, !digitalRead(LED_BLINK));
      digitalWrite(BUZZER_PIN, !digitalRead(LED_BLINK));
      lastBlink = millis();
    }
  }
}

void triggerSOS() {
  sosActive = !sosActive;
  
  if (sosActive) {
    Serial.println("\n🚨🚨🚨 SOS ACTIVATED! 🚨🚨🚨\n");
    
    // Flash all LEDs rapidly
    for (int i = 0; i < 10; i++) {
      digitalWrite(LED_GREEN, HIGH);
      digitalWrite(LED_YELLOW, HIGH);
      digitalWrite(LED_RED, HIGH);
      digitalWrite(LED_BLINK, HIGH);
      digitalWrite(BUZZER_PIN, HIGH);
      delay(80);
      digitalWrite(LED_GREEN, LOW);
      digitalWrite(LED_YELLOW, LOW);
      digitalWrite(LED_RED, LOW);
      digitalWrite(LED_BLINK, LOW);
      digitalWrite(BUZZER_PIN, LOW);
      delay(80);
    }
  } else {
    Serial.println("\n✅ SOS CLEARED\n");
    digitalWrite(BUZZER_PIN, LOW);
  }
}

void blinkAllRed() {
  static unsigned long lastBlink = 0;
  if (millis() - lastBlink > 200) {
    bool state = digitalRead(LED_RED);
    digitalWrite(LED_RED, !state);
    digitalWrite(LED_BLINK, !state);
    digitalWrite(BUZZER_PIN, !state);
    lastBlink = millis();
  }
}

void startupAnimation() {
  Serial.println("\nInitializing SurakshaMesh X Badge...");
  
  // Sequential LED test
  for (int i = 0; i < 2; i++) {
    digitalWrite(LED_GREEN, HIGH);
    delay(150);
    digitalWrite(LED_GREEN, LOW);
    
    digitalWrite(LED_YELLOW, HIGH);
    delay(150);
    digitalWrite(LED_YELLOW, LOW);
    
    digitalWrite(LED_RED, HIGH);
    delay(150);
    digitalWrite(LED_RED, LOW);
    
    digitalWrite(LED_BLINK, HIGH);
    delay(150);
    digitalWrite(LED_BLINK, LOW);
  }
  
  // All LEDs on
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_YELLOW, HIGH);
  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_BLINK, HIGH);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(300);
  
  // All off
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_BLINK, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  
  Serial.println("✅ System Ready\n");
}

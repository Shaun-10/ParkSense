#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Servo.h>
#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// =========================
// Bluetooth (HC-05)
// =========================
SoftwareSerial BT(10, 11); // RX, TX

// =========================
// LCD + SERVO
// =========================
LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo myservo;

// =========================
// Gate Sensors
// =========================
const int trigPin1 = 7;
const int echoPin1 = 6;

const int trigPin2 = 8;
const int echoPin2 = 9;

// =========================
// IR Slot Sensors (A0–A3)
// =========================
const int slot1Pin = A0;
const int slot2Pin = A1;
const int slot3Pin = A2;
const int slot4Pin = A3;

// =========================
// Outputs
// =========================
const int ledOpen = 2;
const int ledIdle = 3;
const int buzzer = 5;
const int servoPin = 4;

// =========================
// Settings
// =========================
const int distanceThreshold = 10;
const unsigned long BT_SEND_INTERVAL = 500; // Send BT data every 500ms
const unsigned long LCD_UPDATE_INTERVAL = 500; // Update LCD every 500ms

bool entryTriggered = false;
bool exitTriggered = false;

unsigned long lastBTSend = 0;
unsigned long lastLCDUpdate = 0;

// =========================
// Distance Function
// =========================
long getDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);

  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 25000);
  if (duration == 0) return -1;

  return duration * 0.034 / 2;
}

// =========================
// Send Data to BT (JSON Format)
// Format: {"slots":[{"id":"1","status":"occupied"},...],"available":2}
// =========================
void sendBTData(bool s1, bool s2, bool s3, bool s4, int available) {
  StaticJsonDocument<200> doc;
  
  JsonArray slotsArray = doc.createNestedArray("slots");
  
  // Add each slot with id and status
  JsonObject slot1 = slotsArray.createNestedObject();
  slot1["id"] = "1";
  slot1["status"] = s1 ? "occupied" : "available";
  
  JsonObject slot2 = slotsArray.createNestedObject();
  slot2["id"] = "2";
  slot2["status"] = s2 ? "occupied" : "available";
  
  JsonObject slot3 = slotsArray.createNestedObject();
  slot3["id"] = "3";
  slot3["status"] = s3 ? "occupied" : "available";
  
  JsonObject slot4 = slotsArray.createNestedObject();
  slot4["id"] = "4";
  slot4["status"] = s4 ? "occupied" : "available";
  
  doc["available"] = available;
  
  serializeJson(doc, BT);
  BT.println(); // Send newline to mark end of message
  
  // Debug to Serial
  serializeJson(doc, Serial);
  Serial.println();
}

// =========================
// SETUP
// =========================
void setup() {
  Serial.begin(9600);
  BT.begin(9600); // HC-05 default baud rate

  lcd.init();
  lcd.backlight();

  pinMode(trigPin1, OUTPUT);
  pinMode(echoPin1, INPUT);
  pinMode(trigPin2, OUTPUT);
  pinMode(echoPin2, INPUT);

  pinMode(slot1Pin, INPUT);
  pinMode(slot2Pin, INPUT);
  pinMode(slot3Pin, INPUT);
  pinMode(slot4Pin, INPUT);

  pinMode(ledOpen, OUTPUT);
  pinMode(ledIdle, OUTPUT);
  pinMode(buzzer, OUTPUT);

  myservo.attach(servoPin);
  myservo.write(0);

  lcd.setCursor(0, 0);
  lcd.print("PARKSENSE");
  lcd.setCursor(0, 1);
  lcd.print("ONLINE!!");
  delay(2000);
  lcd.clear();
  
  Serial.println("=== ParkSense System Started ===");
}

// =========================
// LOOP
// =========================
void loop() {

  // =========================
  // Read Gate Sensors
  // =========================
  long d1 = getDistance(trigPin1, echoPin1);
  long d2 = getDistance(trigPin2, echoPin2);

  bool entrySensor = (d1 > 0 && d1 < distanceThreshold);
  bool exitSensor  = (d2 > 0 && d2 < distanceThreshold);

  // =========================
  // Read IR Slots
  // =========================
  bool s1 = (digitalRead(slot1Pin) == LOW);
  bool s2 = (digitalRead(slot2Pin) == LOW);
  bool s3 = (digitalRead(slot3Pin) == LOW);
  bool s4 = (digitalRead(slot4Pin) == LOW);

  int occupied = s1 + s2 + s3 + s4;
  int available = 4 - occupied;

  // =========================
  // SEND JSON DATA TO APP 📲 (Non-blocking)
  // =========================
  unsigned long currentTime = millis();
  if (currentTime - lastBTSend >= BT_SEND_INTERVAL) {
    sendBTData(s1, s2, s3, s4, available);
    lastBTSend = currentTime;
  }

  // =========================
  // ENTRY
  // =========================
  if (entrySensor && !entryTriggered && !exitTriggered) {
    entryTriggered = true;

    myservo.write(90);
    digitalWrite(ledOpen, HIGH);
    digitalWrite(ledIdle, LOW);

    tone(buzzer, 1000, 150);

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WELCOME");
    lcd.setCursor(0, 1);
    lcd.print("ENTERING...");

    delay(2000);
  }

  // =========================
  // EXIT
  // =========================
  if (exitSensor && !exitTriggered && !entryTriggered) {
    exitTriggered = true;

    myservo.write(90);
    digitalWrite(ledOpen, HIGH);
    digitalWrite(ledIdle, LOW);

    tone(buzzer, 1000, 150);

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("GOODBYE");
    lcd.setCursor(0, 1);
    lcd.print("EXITING...");

    delay(1500);
  }

  // =========================
  // RESET GATE
  // =========================
  if (!entrySensor && !exitSensor) {
    entryTriggered = false;
    exitTriggered = false;

    myservo.write(0);
    digitalWrite(ledOpen, LOW);
    digitalWrite(ledIdle, HIGH);
  }

  // =========================
  // LCD SLOT DISPLAY (Non-blocking)
  // =========================
  if (currentTime - lastLCDUpdate >= LCD_UPDATE_INTERVAL) {
    lcd.clear();

    if (available == 0) {
      lcd.setCursor(0, 0);
      lcd.print("PARKING FULL");
      lcd.setCursor(0, 1);
      lcd.print("NO SLOT LEFT");
    } else {
      lcd.setCursor(0, 0);
      lcd.print("Available:");
      lcd.setCursor(0, 1);
      lcd.print(available);
      lcd.print(" / 4");
    }
    
    lastLCDUpdate = currentTime;
  }
}

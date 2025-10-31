#include <WiFi.h>
#include <esp_now.h>

// === Pin configuration ===
#define LEFT_BEAM 22
#define RIGHT_BEAM 23
#define LED_RED 13
#define LED_YELLOW 12
#define LED_GREEN 14

// === Constants ===
#define VEHICLE_LENGTH_CM 10.0
#define SEND_INTERVAL 2500

// === Globals ===
uint8_t mainAddress[] = {0x88, 0x57, 0x21, 0xBC, 0x45, 0xE8};

unsigned long leftTime = 0, rightTime = 0;
bool leftBroken = false, rightBroken = false;
unsigned long lastSend = 0;
float lastSpeed = 0.0;

// === Function prototypes ===
void sendSpeed(float speed);
void onDataRecv(const esp_now_recv_info_t *info, const uint8_t *data, int len);
void setLights(bool r, bool y, bool g);

// === Setup ===
void setup() {
  Serial.begin(115200);

  pinMode(LEFT_BEAM, INPUT_PULLUP);
  pinMode(RIGHT_BEAM, INPUT_PULLUP);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);

  setLights(true, false, false);

  WiFi.mode(WIFI_STA);
  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
    return;
  }

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, mainAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  esp_now_add_peer(&peerInfo);

  esp_now_register_recv_cb(onDataRecv);
  Serial.println("[COMM] Ready.");
}

// === Loop ===
void loop() {
  unsigned long now = millis();
  bool left = digitalRead(LEFT_BEAM) == LOW;
  bool right = digitalRead(RIGHT_BEAM) == LOW;

  // === LEFT beam handling ===
  if (left && !leftBroken) {
    leftBroken = true;
    leftTime = now;
    // Serial.printf("[COMM] LEFT beam broken at %lu ms\n", now);
  } 
  else if (!left && leftBroken) {
    leftBroken = false;
    // Serial.printf("[COMM] LEFT beam restored at %lu ms\n", now);
  }

  // === RIGHT beam handling ===
  if (right && !rightBroken) {
    rightBroken = true;
    rightTime = now;
    // Serial.printf("[COMM] RIGHT beam broken at %lu ms\n", now);
  } 
  else if (!right && rightBroken) {
    rightBroken = false;
    // Serial.printf("[COMM] RIGHT beam restored at %lu ms\n", now);
  }

  // === Calculate speed once both beams have triggered ===
  if (leftTime > 0 && rightTime > 0 && leftTime != rightTime) {
    unsigned long diff = abs((long)leftTime - (long)rightTime);
    float seconds = diff / 1000.0;
    float speedKmh = (VEHICLE_LENGTH_CM / seconds) * 0.036;
    lastSpeed = speedKmh;

    Serial.printf("[COMM] Vehicle detected — speed: %.2f km/h (Δt = %lu ms)\n", speedKmh, diff);

    sendSpeed(speedKmh);
    lastSend = now;

    leftTime = rightTime = 0; // Reset times after measurement
  }

  // === Send clear signal after SEND_INTERVAL ===
  if (now - lastSend > SEND_INTERVAL) {
    if (lastSpeed != 0.0) {
      Serial.println("[COMM] Sending clear signal (0.0 km/h)");
      lastSpeed = 0.0;
      sendSpeed(lastSpeed);
    }
    lastSend = now;
  }
}

// === Send measured speed ===
void sendSpeed(float speed) {
  uint8_t buffer[4];
  memcpy(buffer, &speed, sizeof(float));
  esp_now_send(mainAddress, buffer, sizeof(buffer));
  Serial.printf("[COMM] Sent speed data: %.2f km/h\n", speed);
}

// === Receive light commands from main ===
void onDataRecv(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  if (len < 1) return;
  uint8_t cmd = data[0];
  switch (cmd) {
    case 0: setLights(true, false, false);  Serial.println("[COMM] Light: RED"); break;
    case 1: setLights(false, true, false);  Serial.println("[COMM] Light: YELLOW"); break;
    case 2: setLights(false, false, true);  Serial.println("[COMM] Light: GREEN"); break;
  }
}

// === Control light LEDs ===
void setLights(bool r, bool y, bool g) {
  digitalWrite(LED_RED, r);
  digitalWrite(LED_YELLOW, y);
  digitalWrite(LED_GREEN, g);
}

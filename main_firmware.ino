// FIRMWARE FOR PUSHBUTTON.

#include <WiFi.h>
#include <esp_now.h>

#define BUTTON_PIN 13
#define BUZZER_PIN 16

uint8_t commAddress[] = {0x44, 0x1D, 0x64, 0xF3, 0xDB, 0xC4};

#define CROSS_TIME 8000
#define YELLOW_TIME 3000
#define COOLDOWN_TIME 10000
#define SPEED_THRESHOLD_KMH 10.0
#define SPEED_TIMEOUT 1000 

bool isCrossing = false;
bool inCooldown = false;
unsigned long phaseStart = 0;
unsigned long cooldownStart = 0;
float latestSpeed = 0.0;
unsigned long lastSpeedUpdate = 0; 

unsigned long lastBuzzerToggle = 0;
bool buzzerOn = false;

bool waitingForVehicle = false;
unsigned long vehicleCooldownStart = 0;
const unsigned long VEHICLE_WAIT_TIME = 3000; 

enum LightState { RED, YELLOW, GREEN, YELLOW_END };
LightState lightState = RED;


void onRecv(const esp_now_recv_info_t *info, const uint8_t *data, int len);
void setLight(LightState state);
void updateLogic();


void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);

  WiFi.mode(WIFI_STA);
  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed!");
    return;
  }

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, commAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  esp_now_add_peer(&peerInfo);

  esp_now_register_recv_cb(onRecv);

  setLight(RED);
  Serial.println("[MAIN] Ready.");
}


void loop() {
  updateLogic();


  static bool lastButton = HIGH;
  bool currentButton = digitalRead(BUTTON_PIN);
  if (lastButton == HIGH && currentButton == LOW) {
    Serial.println("[MAIN] Button pressed");
    if (!isCrossing && !inCooldown && latestSpeed < SPEED_THRESHOLD_KMH) {
      isCrossing = true;
      phaseStart = millis();
      setLight(YELLOW);
      Serial.println("[MAIN] Safe to cross → yellow");
    } else {
      Serial.println("[MAIN] Unsafe (fast vehicle or cooldown)");
      tone(BUZZER_PIN, 440, 200);
    }
  }
  lastButton = currentButton;
}


void updateLogic() {
  unsigned long now = millis();

  if (latestSpeed > 0.0 && (now - lastSpeedUpdate > SPEED_TIMEOUT)) {
    Serial.println("[MAIN] Speed high-water mark expired. Resetting to 0.");
    latestSpeed = 0.0;
  }

  if (isCrossing) {
    switch (lightState) {
      case YELLOW:
        if (now - phaseStart >= YELLOW_TIME) { 
          Serial.println("[MAIN] Transition: YELLOW → GREEN");
          setLight(GREEN);
          phaseStart = now;
        }
        break;

      case GREEN:
        if (now - phaseStart >= CROSS_TIME) {
          Serial.println("[MAIN] Transition: GREEN → YELLOW");
          setLight(YELLOW);
          phaseStart = now;
          lightState = YELLOW_END; 
        }
        break;

      case YELLOW_END:
        if (now - phaseStart >= YELLOW_TIME) {
          Serial.println("[MAIN] Transition: YELLOW → RED");
          setLight(RED);
          isCrossing = false;
          inCooldown = true;
          cooldownStart = now;
        }
        break;

      default:
        break;
    }
  }


  if (inCooldown && (now - cooldownStart >= COOLDOWN_TIME)) {
    inCooldown = false;
    Serial.println("[MAIN] Cooldown ended");
  }

  static unsigned long lastBeep = 0;
  unsigned long beepInterval = 1000;
  int beepTone = 3500;

  if (lightState == GREEN) {
    beepInterval = 300; 
    beepTone = 1200;
  } else if (lightState == YELLOW) { 
    beepInterval = 600;
    beepTone = 900;
  } else if (lightState == YELLOW_END) { 
    beepInterval = 450; 
    beepTone = 1050;
  }

  if (now - lastBeep >= beepInterval) {
    tone(BUZZER_PIN, beepTone, 80); 
    lastBeep = now;
  }
}

void onRecv(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  if (len == sizeof(float)) {
    float newSpeed;
    memcpy(&newSpeed, data, sizeof(float));
    Serial.printf("[MAIN] Vehicle speed received: %.2f km/h\n", newSpeed);

    if (newSpeed > latestSpeed) {
      latestSpeed = newSpeed;
    }

    lastSpeedUpdate = millis();
  }
}

void setLight(LightState state) {
  if (state != YELLOW_END) {
    lightState = state;
  }
  
  uint8_t cmd = static_cast<uint8_t>(state);
  
  if (state == YELLOW_END) {
    cmd = static_cast<uint8_t>(YELLOW);
  }

  esp_now_send(commAddress, &cmd, 1);
}

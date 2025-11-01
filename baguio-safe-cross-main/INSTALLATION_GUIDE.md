# Smart Traffic Management System
## Installation & Configuration Guide

---

## 📋 Pre-Installation Checklist

### **Site Requirements Assessment**
- [ ] **Traffic Volume Analysis**: Document peak hour traffic patterns
- [ ] **Intersection Geometry**: Measure approach distances and lane configurations  
- [ ] **Power Infrastructure**: Verify 220V AC power availability with backup options
- [ ] **Network Connectivity**: Confirm cellular coverage or wired internet access
- [ ] **Environmental Conditions**: Assess weather exposure and protection needs
- [ ] **Regulatory Compliance**: Obtain necessary permits and approvals

### **Required Tools & Equipment**
- [ ] **Installation Tools**: Standard electrical and mounting hardware
- [ ] **Testing Equipment**: Multimeter, network analyzer, calibration tools
- [ ] **Safety Equipment**: Traffic cones, warning signs, safety vests
- [ ] **Calibration Devices**: Vehicle simulator, audio level meter
- [ ] **Documentation**: Installation manual, wiring diagrams, configuration sheets

---

## 🔧 Hardware Installation

### **Step 1: Sensor Array Installation**

#### **IR Sensor Placement**
```
Traffic Flow Direction →
                    ┌──────────┐
   35m    45m    60m│          │ Intersection
    │      │      │ │  STOP    │
    ▼      ▼      ▼ │  LINE    │
   [S1]   [S2]   [S3]│  67m     │
                    └──────────┘
```

**Installation Process:**
1. **Mount Sensor 1 (S1)** at 35 meters from stop line
   - Height: 3-4 meters above road surface
   - Angle: 15° downward tilt toward road
   - Protection: Weatherproof housing with heater

2. **Mount Sensor 2 (S2)** at 45 meters from stop line
   - Same specifications as S1
   - Ensure clear line of sight to road surface
   - Install backup power connection

3. **Mount Sensor 3 (S3)** at 60 meters from stop line
   - Primary detection zone for high-speed vehicles
   - Enhanced sensitivity settings for early detection
   - Redundant backup sensor recommended

#### **Wiring & Connections**
```
Main Controller Box
├── Power Input (220V AC)
├── Battery Backup (12V DC)
├── Network Module (4G/WiFi)
├── Sensor Array Interface
│   ├── IR Sensor 1 (35m)
│   ├── IR Sensor 2 (45m)
│   └── IR Sensor 3 (60m)
├── Traffic Light Control
├── Audio System Output
└── Emergency Override Panel
```

### **Step 2: Traffic Light Integration**

#### **LED Signal Installation**
1. **Primary Signals**: Install 3-aspect LED signals (Red/Amber/Green)
2. **Backup System**: Integrate with existing signals or install redundant units
3. **Control Interface**: Connect signal controller to main system
4. **Testing**: Verify all aspects function correctly and timing is accurate

#### **Signal Timing Configuration**
```yaml
Signal Phases:
  Green: Variable (AI-optimized)
  Amber: 3 seconds (fixed)
  Red: 15-60 seconds (adaptive)
  
Pedestrian Phase:
  Walk: 15-30 seconds (based on detected pedestrian type)
  Clearance: 5-10 seconds buffer
```

### **Step 3: Audio System Setup**

#### **Speaker Installation**
1. **Primary Speakers**: Mount 2 weatherproof speakers for 360° coverage
2. **Volume Calibration**: Set to 75dB at 5 meters distance
3. **Audio Quality**: Test frequency response 200Hz-8kHz
4. **Weather Protection**: Ensure IP65 rating or better

#### **Audio Configuration**
```javascript
// Audio Message Templates
const audioMessages = {
  en: {
    wait: "Do not cross. Traffic light is red. Please wait for the safe crossing signal.",
    cross: "Safe to cross. You have 20 seconds to cross safely. Traffic light is red for vehicles.",
    warning: "Caution. Vehicle approaching. Please wait."
  },
  fil: {
    wait: "Huwag tumawid. Pula ang ilaw. Maghintay para sa signal na ligtas na tumawid.",
    cross: "Ligtas na tumawid. May 20 segundo kayo para tumawid nang ligtas. Pula ang ilaw para sa mga sasakyan.",
    warning: "Mag-ingat. May paparating na sasakyan. Maghintay muna."
  }
};
```

### **Step 4: Pedestrian Button Installation**

#### **Button Specifications**
- **Type**: Vandal-resistant, weatherproof push button
- **Surface**: Tactile with Braille instructions
- **Mounting**: ADA compliant height (42-48 inches)
- **Feedback**: Audio confirmation beep and LED indicator

#### **Accessibility Features**
```
Button Layout:
┌─────────────────┐
│ ⠏⠑⠙⠑⠎⠞⠗⠊⠁⠝ ⠃⠥⠞⠞⠕⠝│ ← Braille: "PEDESTRIAN BUTTON"
│                 │
│       [●]       │ ← Large tactile button
│                 │
│ ⠏⠗⠑⠎⠎ ⠞⠕ ⠉⠗⠕⠎⠎     │ ← Braille: "PRESS TO CROSS"
└─────────────────┘
```

---

## 💻 Software Installation

### **Step 1: System Requirements**

#### **Hardware Specifications**
- **CPU**: ARM Cortex-A8 or equivalent (minimum 1GHz)
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 32GB eMMC with SD card expansion
- **Network**: 4G/LTE modem with WiFi backup
- **I/O**: GPIO pins for sensor and actuator control

#### **Operating System**
```bash
# Install Base System
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm python3 python3-pip -y

# Install Required Libraries
sudo apt install wiringpi gpio-utils i2c-tools -y
sudo npm install -g pm2 typescript
```

### **Step 2: Application Deployment**

#### **Clone Repository**
```bash
git clone https://github.com/traffic-management/smart-system.git
cd smart-system
npm install
```

#### **Environment Configuration**
```bash
# Create environment file
cat > .env << EOF
# System Configuration
SYSTEM_ID=INTERSECTION_001
LOCATION=BAGUIO_CITY_MAIN
DEBUG_MODE=false

# Network Configuration  
API_URL=https://api.traffic-management.com
BACKUP_URL=https://backup.traffic-management.com
WEBSOCKET_URL=wss://live.traffic-management.com

# Hardware Configuration
SENSOR_COUNT=3
AUDIO_ENABLED=true
BACKUP_POWER_MONITOR=true

# AI Configuration
LEARNING_ENABLED=true
CONFIDENCE_THRESHOLD=0.7
PATTERN_MEMORY_DAYS=30

# Security
API_KEY=your_secure_api_key_here
ENCRYPTION_KEY=your_encryption_key_here
EOF
```

#### **Database Setup**
```sql
-- Create system database
CREATE DATABASE traffic_management;
USE traffic_management;

-- Traffic patterns table
CREATE TABLE traffic_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    hour TINYINT NOT NULL,
    day_of_week TINYINT NOT NULL,
    vehicle_count INT DEFAULT 0,
    average_speed DECIMAL(5,2) DEFAULT 0,
    weather_condition ENUM('clear','rain','fog','snow') DEFAULT 'clear',
    visibility TINYINT DEFAULT 100,
    INDEX idx_time (timestamp),
    INDEX idx_hour_dow (hour, day_of_week)
);

-- System logs table
CREATE TABLE system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    level ENUM('info','warning','error','critical') NOT NULL,
    component VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details JSON,
    INDEX idx_timestamp (timestamp),
    INDEX idx_level (level)
);

-- Performance metrics table
CREATE TABLE performance_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    metric_name VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20),
    INDEX idx_metric_time (metric_name, timestamp)
);
```

### **Step 3: Service Configuration**

#### **Create System Service**
```bash
# Create service file
sudo cat > /etc/systemd/system/traffic-management.service << EOF
[Unit]
Description=Smart Traffic Management System
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/smart-system
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable traffic-management
sudo systemctl start traffic-management
```

#### **Process Management**
```bash
# Use PM2 for advanced process management
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## ⚙️ System Configuration

### **Step 1: Sensor Calibration**

#### **Automatic Calibration Process**
```javascript
// Sensor calibration script
const calibrateSensors = async () => {
  console.log('Starting sensor calibration...');
  
  // Baseline noise measurement
  const noiseLevel = await measureAmbientNoise(30000); // 30 seconds
  
  // Sensitivity adjustment
  for (let sensor = 1; sensor <= 3; sensor++) {
    await calibrateSensor(sensor, {
      sensitivity: 85, // Starting value
      noiseThreshold: noiseLevel * 1.2,
      confirmationTime: 200, // ms
      maxRange: sensor * 10 + 25 // 35m, 45m, 60m
    });
  }
  
  console.log('Sensor calibration complete');
};
```

#### **Manual Calibration**
1. **Access calibration interface** in system dashboard
2. **Position test vehicle** at known distances
3. **Adjust sensitivity** until reliable detection achieved
4. **Test edge cases** (motorcycles, large trucks, adverse weather)
5. **Save calibration profile** for current environmental conditions

### **Step 2: Traffic Light Timing**

#### **Base Timing Configuration**
```yaml
timing_profiles:
  default:
    red_duration: 25  # seconds
    amber_duration: 3  # seconds (fixed)
    green_minimum: 10  # seconds
    green_maximum: 120  # seconds
    pedestrian_minimum: 15  # seconds
    pedestrian_maximum: 30  # seconds
    
  peak_hours:
    red_duration: 20
    green_minimum: 15
    green_maximum: 90
    
  off_peak:
    red_duration: 30
    green_minimum: 8
    green_maximum: 180
```

#### **AI Learning Parameters**
```javascript
const aiConfig = {
  learningRate: 0.01,
  memoryWindow: 30, // days
  minimumDataPoints: 100,
  confidenceThreshold: 0.7,
  adaptationSpeed: 'moderate', // conservative, moderate, aggressive
  weatherWeight: 1.5, // increase impact of weather data
  timeOfDayWeight: 2.0, // higher weight for time-based patterns
  emergencyOverride: true // always prioritize emergency vehicles
};
```

### **Step 3: Audio System Setup**

#### **Volume Calibration**
```bash
# Audio level testing script
#!/bin/bash
echo "Testing audio levels..."

# Test at different distances
for distance in 5 10 15 20; do
  echo "Testing at ${distance}m distance"
  aplay test_announcement.wav &
  AUDIO_PID=$!
  
  # Measure with sound level meter
  echo "Measure dB level at ${distance}m and press enter"
  read
  
  kill $AUDIO_PID 2>/dev/null
done

echo "Audio calibration complete"
```

#### **Message Customization**
```javascript
// Customizable audio messages
const customizeAudioMessages = {
  location: "Baguio City Main Intersection",
  
  templates: {
    waiting: {
      en: `Do not cross at ${location}. Traffic light is red. Please wait for the safe crossing signal.`,
      fil: `Huwag tumawid sa ${location}. Pula ang ilaw. Maghintay para sa signal na ligtas na tumawid.`
    },
    
    crossing: {
      en: `Safe to cross at ${location}. You have {duration} seconds to cross safely.`,
      fil: `Ligtas na tumawid sa ${location}. May {duration} segundo kayo para tumawid nang ligtas.`
    }
  }
};
```

---

## 🔍 Testing & Validation

### **Step 1: Component Testing**

#### **Sensor Functionality Test**
```bash
#!/bin/bash
# Comprehensive sensor testing

echo "Starting sensor functionality tests..."

# Test each sensor individually
for sensor in 1 2 3; do
  echo "Testing Sensor $sensor"
  
  # Check power and connectivity
  if ! sensor_status $sensor; then
    echo "ERROR: Sensor $sensor not responding"
    exit 1
  fi
  
  # Test detection capability
  echo "Place test vehicle in sensor $sensor detection zone and press enter"
  read
  
  if sensor_detect $sensor; then
    echo "SUCCESS: Sensor $sensor detected vehicle"
  else
    echo "ERROR: Sensor $sensor failed to detect vehicle"
    exit 1
  fi
  
  echo "Remove vehicle and press enter"
  read
  
  sleep 2
  
  if ! sensor_detect $sensor; then
    echo "SUCCESS: Sensor $sensor cleared detection"
  else
    echo "ERROR: Sensor $sensor stuck in detection state"
    exit 1
  fi
done

echo "All sensors passed functionality tests"
```

#### **Traffic Light Control Test**
```javascript
// Traffic light testing sequence
const testTrafficLights = async () => {
  console.log('Testing traffic light control...');
  
  // Test each signal state
  const states = ['red', 'amber', 'green', 'off'];
  
  for (const state of states) {
    console.log(`Setting signal to ${state}`);
    await setTrafficLight(state);
    
    // Verify visual confirmation
    const confirmed = await askForConfirmation(`Is traffic light ${state}?`);
    if (!confirmed) {
      throw new Error(`Traffic light ${state} state not working`);
    }
    
    await sleep(3000); // 3 second delay between tests
  }
  
  console.log('Traffic light control test passed');
};
```

#### **Audio System Test**
```javascript
// Audio system validation
const testAudioSystem = async () => {
  console.log('Testing audio system...');
  
  // Test both languages
  const languages = ['en', 'fil'];
  
  for (const lang of languages) {
    console.log(`Testing ${lang} audio messages`);
    
    // Test different message types
    const messageTypes = ['wait', 'cross', 'warning'];
    
    for (const type of messageTypes) {
      await playAudioMessage(lang, type);
      
      const audible = await askForConfirmation(
        `Was the ${lang} ${type} message clearly audible?`
      );
      
      if (!audible) {
        throw new Error(`Audio test failed for ${lang} ${type}`);
      }
    }
  }
  
  console.log('Audio system test passed');
};
```

### **Step 2: Integration Testing**

#### **Complete System Workflow**
```javascript
// End-to-end system test
const fullSystemTest = async () => {
  console.log('Starting complete system integration test...');
  
  // Test 1: Normal pedestrian crossing
  console.log('Test 1: Normal pedestrian crossing');
  await simulatePedestrianButton();
  await verifySignalSequence(['amber', 'red']);
  await verifyAudioAnnouncement('cross');
  await verifyTimingDuration(25); // 25 second red light
  await verifySignalReturn('green');
  
  // Test 2: Vehicle detection during crossing request
  console.log('Test 2: Vehicle detection with crossing request');
  await simulateVehicleApproach(50, 30); // 50 km/h at 30m
  await simulatePedestrianButton();
  await verifyDelayedResponse(); // Should wait for vehicle to pass
  
  // Test 3: Emergency vehicle priority
  console.log('Test 3: Emergency vehicle priority');
  await simulateEmergencyVehicle();
  await verifyImmediateGreen();
  await verifyEmergencyOverride();
  
  // Test 4: System failure response
  console.log('Test 4: Failsafe operation');
  await simulateComponentFailure('primary_sensor');
  await verifyBackupActivation();
  await verifyFailsafeMode();
  
  console.log('All integration tests passed');
};
```

### **Step 3: Performance Validation**

#### **Response Time Testing**
```javascript
// Performance benchmarks
const performanceTests = {
  buttonResponseTime: {
    target: 2000, // 2 seconds maximum
    test: async () => {
      const start = Date.now();
      await pressPedestrianButton();
      const signalChange = await waitForSignalChange();
      return signalChange - start;
    }
  },
  
  vehicleDetectionLatency: {
    target: 100, // 100ms maximum
    test: async () => {
      const start = Date.now();
      await simulateVehicleEntry();
      const detection = await waitForDetectionEvent();
      return detection - start;
    }
  },
  
  emergencyResponse: {
    target: 5000, // 5 seconds maximum
    test: async () => {
      const start = Date.now();
      await simulateEmergencyVehicle();
      const greenSignal = await waitForGreenSignal();
      return greenSignal - start;
    }
  }
};
```

---

## 📊 Monitoring & Maintenance

### **Daily Monitoring Checklist**
- [ ] **System Health**: All components show "online" status
- [ ] **Detection Accuracy**: Sensors responding correctly to vehicles
- [ ] **Audio Quality**: Clear, audible announcements in both languages
- [ ] **Signal Timing**: Traffic lights changing within expected timeframes
- [ ] **Network Connectivity**: Real-time data transmission functioning
- [ ] **Battery Backup**: Backup power system fully charged
- [ ] **Error Logs**: No critical errors in system logs

### **Weekly Maintenance Tasks**
- [ ] **Sensor Cleaning**: Remove dirt, debris, or obstructions
- [ ] **Calibration Check**: Verify sensor sensitivity and accuracy
- [ ] **Audio Test**: Full audio system functionality test
- [ ] **Network Speed**: Test connection speed and latency
- [ ] **Data Backup**: Verify automatic backup systems
- [ ] **Performance Review**: Analyze week"s performance metrics

### **Monthly System Review**
- [ ] **AI Learning Progress**: Review pattern recognition improvements
- [ ] **Performance Optimization**: Implement recommended timing adjustments
- [ ] **Hardware Inspection**: Physical inspection of all components
- [ ] **Software Updates**: Install available system updates
- [ ] **Security Audit**: Review access logs and security measures

---

## 🚨 Troubleshooting

### **Common Issues & Solutions**

#### **Sensor Not Detecting Vehicles**
**Symptoms:**
- No vehicle detection events in logs
- Traffic never delayed despite approaching vehicles
- Sensor status shows "offline" or "degraded"

**Diagnosis:**
```bash
# Check sensor connectivity
sensor_diagnostic --sensor=1 --verbose

# Test sensor response
vehicle_simulator --sensor=1 --speed=40

# Review sensor logs
tail -f /var/log/traffic/sensor.log
```

**Solutions:**
1. **Clean sensor lens** - Remove dirt, snow, or debris
2. **Check power connection** - Verify 12V DC supply
3. **Adjust sensitivity** - Increase from 85% to 90%
4. **Replace sensor** - If hardware failure detected

#### **Audio Announcements Not Working**
**Symptoms:**
- No sound during pedestrian crossing
- Garbled or unclear audio
- Only one language working

**Diagnosis:**
```bash
# Test audio hardware
aplay /usr/share/sounds/test.wav

# Check volume levels
amixer get Master

# Test TTS system
espeak "Test message" | aplay
```

**Solutions:**
1. **Check speaker connections** - Verify all audio cables
2. **Adjust volume levels** - Set to 75dB at 5 meters
3. **Update audio files** - Re-record damaged message files
4. **Replace speakers** - If hardware damage detected

#### **Traffic Light Not Responding**
**Symptoms:**
- Signals not changing color
- Stuck on single color
- Timing incorrect

**Diagnosis:**
```bash
# Test signal control
signal_test --state=red --duration=5

# Check control interface
relay_test --output=traffic_light

# Monitor signal controller
watch -n 1 cat /sys/class/gpio/gpio18/value
```

**Solutions:**
1. **Check control wiring** - Verify signal controller connections
2. **Test relay operation** - Replace failed control relays
3. **Reset controller** - Power cycle signal control system
4. **Manual override** - Use emergency controls if needed

### **Emergency Procedures**

#### **Complete System Failure**
1. **Activate manual controls** - Use physical override buttons
2. **Deploy temporary signals** - Set up standard traffic cones and signs
3. **Contact maintenance team** - Emergency repair response
4. **Document failure** - Record failure time and symptoms
5. **Implement backup plan** - Follow traffic management protocols

#### **Network Connectivity Loss**
1. **System continues autonomous operation** - Local processing maintains basic functions
2. **Check backup connections** - Verify secondary network paths
3. **Review cached data** - System uses stored patterns for decision making
4. **Manual monitoring** - Increase on-site supervision until connectivity restored

---

## ✅ Installation Completion

### **Final Verification Checklist**
- [ ] **All hardware installed** and functioning correctly
- [ ] **Software configured** with site-specific parameters
- [ ] **Sensors calibrated** for local conditions
- [ ] **Audio system tested** in both languages
- [ ] **Traffic light integration** verified
- [ ] **Network connectivity** established
- [ ] **Backup systems** tested and operational
- [ ] **Safety compliance** verified (BP 344, local standards)
- [ ] **Operator training** completed
- [ ] **Documentation** provided to site managers

### **Handover Package**
1. **System documentation** - Complete installation and operation manuals
2. **Training materials** - Operator guides and troubleshooting procedures
3. **Warranty information** - Hardware and software support details
4. **Emergency contacts** - 24/7 support and maintenance contacts
5. **Performance baselines** - Initial system performance metrics
6. **Maintenance schedule** - Recommended service intervals

### **Post-Installation Support**
- **24/7 monitoring** for first 30 days
- **Weekly check-ins** for optimization
- **Performance reporting** monthly for first year
- **On-site support** available within 4 hours
- **Remote diagnostics** continuous monitoring
- **Software updates** automatic installation

---

*Installation Guide Version 2.0.1 - For technical support during installation, contact our 24/7 installation hotline.*
import { useState, useEffect, useCallback } from "react";
import { TrafficLight } from "@/components/TrafficLight";
import { PedestrianButton } from "@/components/PedestrianButton";
import { VehicleDetection } from "@/components/VehicleDetection";
import { VehicleSimulator } from "@/components/VehicleSimulator";
import { ControlPanel } from "@/components/ControlPanel";
import { SystemLogs } from "@/components/SystemLogs";
import { TrafficAnalytics } from "@/components/TrafficAnalytics";
import { SystemHealth } from "@/components/SystemHealth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Shield, Accessibility, Volume2, FileText } from "lucide-react";
import { audioManager } from "@/lib/audioManager";
import { QueueAnalysis } from "@/lib/queueDetection";

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  details?: string;
}

const Index = () => {
  // System state
  const [systemEnabled, setSystemEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [trafficLightState, setTrafficLightState] = useState<'red' | 'amber' | 'green' | 'off'>('green');
  const [language, setLanguage] = useState<'en' | 'fil'>('en');
  const [isButtonActive, setIsButtonActive] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Vehicle detection state
  const [vehicleDetected, setVehicleDetected] = useState(false);
  const [vehicleSpeed, setVehicleSpeed] = useState(0);
  const [distanceToStop, setDistanceToStop] = useState(0);
  const [canSafelyStop, setCanSafelyStop] = useState(true);
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [isDecelerating, setIsDecelerating] = useState(false);
  const [requiredStoppingDistance, setRequiredStoppingDistance] = useState(0);
  const [decelerationRate, setDecelerationRate] = useState(0);
  const [queueAnalysis, setQueueAnalysis] = useState<QueueAnalysis | null>(null);
  const [averageVehicleCount, setAverageVehicleCount] = useState(5);
  const [averageSpeed, setAverageSpeed] = useState(35);
  
  // Settings
  const [redLightDuration, setRedLightDuration] = useState(25);
  const [sensorSensitivity, setSensorSensitivity] = useState(85);
  const [audioMessages, setAudioMessages] = useState({
    en: {
      wait: "Do not cross. Traffic light is red. Please wait for the safe crossing signal.",
      cross: "Safe to cross. You have 20 seconds to cross safely. Traffic light is red for vehicles."
    },
    fil: {
      wait: "Huwag tumawid. Pula ang ilaw. Maghintay para sa signal na ligtas na tumawid.",
      cross: "Ligtas na tumawid. May 20 segundo kayo para tumawid nang ligtas. Pula ang ilaw para sa mga sasakyan."
    }
  });

  // Add log entry
  const addLog = useCallback((type: LogEntry['type'], message: string, details?: string) => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random()}`, // Ensure unique IDs
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    };
    setLogs(prev => [newLog, ...prev.slice(0, 19)]); // Keep last 20 logs
  }, []);

  // Handle audio toggle
  const handleAudioToggle = useCallback(() => {
    const newAudioState = !audioEnabled;
    setAudioEnabled(newAudioState);
    audioManager.setEnabled(newAudioState);
    addLog('info', `Audio ${newAudioState ? 'enabled' : 'disabled'}`);
  }, [audioEnabled, addLog]);

  // Handle pedestrian button press
  const handleButtonPress = useCallback(async () => {
    if (!systemEnabled) {
      addLog('warning', 'Button press ignored - system disabled');
      return;
    }

    addLog('info', 'Pedestrian call button pressed', `Language: ${language}, Audio: ${audioEnabled ? 'ON' : 'OFF'}`);
    
    // Play button press audio feedback
    if (audioEnabled) {
      audioManager.playBeep(1000, 150);
    }
    
    setIsButtonActive(true);

    // Enhanced decision making with queue analysis
    if (vehicleDetected && (!canSafelyStop || (queueAnalysis && queueAnalysis.recommendedAction !== 'allow_crossing'))) {
      let delayReason = 'unsafe vehicle approach';
      
      if (queueAnalysis) {
        if (queueAnalysis.hasEmergencyVehicle) {
          delayReason = 'emergency vehicle priority';
        } else if (queueAnalysis.recommendedAction === 'delay_crossing') {
          delayReason = queueAnalysis.reasoning.toLowerCase();
        }
      }
      
      addLog('warning', `Crossing delayed: ${delayReason}`, 
        `Vehicle speed: ${vehicleSpeed}km/h, Distance: ${distanceToStop}m, Queue: ${queueAnalysis?.queueLength || 0} vehicles`);
      
      // Wait for conditions to improve
      setTimeout(() => {
        if (trafficLightState === 'green') {
          changeToRed();
        }
      }, queueAnalysis?.hasEmergencyVehicle ? 8000 : 3000);
    } else {
      changeToRed();
    }
  }, [systemEnabled, language, audioEnabled, vehicleDetected, canSafelyStop, vehicleSpeed, distanceToStop, trafficLightState, queueAnalysis, addLog]);

  const changeToRed = useCallback(async () => {
    setTrafficLightState('amber');
    addLog('info', 'Traffic light changing to amber (3s warning)');
    
    // Play amber warning beep
    if (audioEnabled) {
      audioManager.playBeep(600, 300);
    }
    
    setTimeout(async () => {
      setTrafficLightState('red');
      addLog('success', `Red light activated for ${redLightDuration} seconds`, 'Safe to cross');
      
      // Play crossing announcement when light turns red
      if (audioEnabled) {
        audioManager.playAudioCue(audioMessages[language].cross, language, true);
      }
      
      setTimeout(() => {
        setTrafficLightState('green');
        setIsButtonActive(false);
        addLog('info', 'Traffic light returned to green');
      }, redLightDuration * 1000);
    }, 3000);
  }, [redLightDuration, audioEnabled, addLog, audioMessages, language]);

  // Enhanced vehicle detection handler with queue analysis
  const handleVehicleDetection = useCallback((
    detected: boolean, 
    speed: number, 
    distance: number, 
    canStop: boolean,
    isDecelerating?: boolean,
    requiredStoppingDistance?: number,
    decelerationRate?: number,
    queueAnalysis?: QueueAnalysis
  ) => {
    setVehicleDetected(detected);
    setVehicleSpeed(speed);
    setDistanceToStop(distance);
    setCanSafelyStop(canStop);
    setIsDecelerating(isDecelerating || false);
    setRequiredStoppingDistance(requiredStoppingDistance || 0);
    setDecelerationRate(decelerationRate || 0);
    setQueueAnalysis(queueAnalysis || null);
    
    // Update traffic analytics with current data
    setAverageVehicleCount(prev => Math.round((prev + (detected ? 1 : 0)) / 2));
    setAverageSpeed(prev => detected ? Math.round((prev + speed) / 2) : prev);
    
    // Enhanced logging for physics-based detection and queue analysis
    if (detected && isDecelerating !== undefined) {
      const status = canStop ? 'SAFE' : 'UNSAFE';
      const decelStatus = isDecelerating ? ' (DECELERATING)' : '';
      const queueStatus = queueAnalysis ? ` | Queue: ${queueAnalysis.queueLength} vehicles` : '';
      const emergencyStatus = queueAnalysis?.hasEmergencyVehicle ? ' | EMERGENCY' : '';
      
      addLog(
        canStop && queueAnalysis?.recommendedAction === 'allow_crossing' ? 'success' : 'warning', 
        `Vehicle detected: ${status}${decelStatus}${emergencyStatus}`,
        `Speed: ${speed}km/h, Distance: ${distance}m/${requiredStoppingDistance}m, Decel: ${decelerationRate?.toFixed(1)}m/s²${queueStatus}`
      );
    }
  }, [addLog]);

  // Simulate vehicle detection - now controlled by VehicleSimulator
  const runScenario = useCallback((scenario: 'safe' | 'unsafe') => {
    // Stop current simulation temporarily
    setSimulationRunning(false);
    
    if (scenario === 'safe') {
      setVehicleDetected(true);
      setVehicleSpeed(25);
      setDistanceToStop(45);
      setCanSafelyStop(true);
      addLog('success', 'Manual scenario: Vehicle can stop safely', 'Speed: 25km/h, Distance: 45m');
      
      setTimeout(() => {
        setVehicleDetected(false);
        addLog('info', 'Vehicle cleared intersection');
        setSimulationRunning(true); // Resume simulation
      }, 5000);
    } else {
      setVehicleDetected(true);
      setVehicleSpeed(55);
      setDistanceToStop(20);
      setCanSafelyStop(false);
      addLog('warning', 'Manual scenario: Vehicle cannot stop safely', 'Speed: 55km/h, Distance: 20m');
      
      setTimeout(() => {
        setVehicleDetected(false);
        addLog('info', 'Vehicle cleared intersection');
        setSimulationRunning(true); // Resume simulation
      }, 3000);
    }
  }, [addLog]);

  // Handle audio message changes
  const handleAudioMessageChange = useCallback((lang: 'en' | 'fil', type: 'wait' | 'cross', message: string) => {
    setAudioMessages(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [type]: message
      }
    }));
  }, []);

  // Manual override and maintenance handlers
  const handleManualOverride = useCallback(() => {
    addLog('warning', 'Manual override activated by operator');
    setTrafficLightState('green');
    setIsButtonActive(false);
    setSystemEnabled(false); // Disable system when override is used
    
    // Re-enable system after 10 seconds
    setTimeout(() => {
      setSystemEnabled(true);
      addLog('info', 'System automatically re-enabled after override');
    }, 10000);
  }, [addLog]);

  const handleMaintenanceMode = useCallback(() => {
    addLog('info', 'Maintenance mode toggled - backup systems activated');
  }, [addLog]);

  // Initialize system
  useEffect(() => {
    addLog('success', 'Smart Pedestrian Call Button System initialized', 'Baguio City Traffic Management');
    addLog('info', 'System compliant with BP 344 Accessibility Law');
    addLog('info', 'IR sensor array calibrated', `Sensitivity: ${sensorSensitivity}%`);
    addLog('info', 'Audio system ready', 'Click anywhere to enable audio');
    
    // Set initial audio state
    audioManager.setEnabled(audioEnabled);
  }, [sensorSensitivity, audioEnabled, addLog]);

  return (
    <div className="min-h-screen bg-background">
      {/* Clean Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Smart Traffic Management</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Safety Solution</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex">
                <Shield className="w-3 h-3 mr-1" />
                System Active
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Live Traffic Intelligence */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Live Traffic Intelligence Center</h2>
            <p className="text-muted-foreground">Real-time AI-powered traffic management and safety analysis</p>
          </div>

          {/* Main Traffic Simulation - Responsive Layout */}
          <div className="mb-8">
            <Card className="p-4 sm:p-6 lg:p-8 overflow-hidden">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">Live Traffic & Pedestrian Simulation</h3>
                <p className="text-sm sm:text-base text-muted-foreground">Real-time vehicle flow and intersection management</p>
              </div>
              
              {/* Responsive simulation container */}
              <div className="w-full flex justify-center mb-4 sm:mb-6">
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl xl:max-w-4xl">
                  <VehicleSimulator
                    onVehicleDetection={handleVehicleDetection}
                    isSimulationRunning={simulationRunning}
                    onToggleSimulation={() => setSimulationRunning(!simulationRunning)}
                    trafficLightState={trafficLightState}
                    className="w-full h-auto transform scale-90 sm:scale-100 md:scale-110 lg:scale-125 xl:scale-150 origin-center"
                  />
                </div>
              </div>
              
              {/* Status indicator */}
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm p-2 sm:p-3 bg-muted/30 rounded-lg">
                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${simulationRunning ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                <span className="font-medium">{simulationRunning ? 'Live Simulation Active' : 'Simulation Paused'}</span>
              </div>
            </Card>
          </div>

          {/* Control & Detection Grid - Enhanced Responsive Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Traffic Control Hub with Pedestrian Call */}
            <Card className="p-4 sm:p-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">Traffic Control Hub</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">AI-Controlled Signal & Pedestrian System</p>
              </div>
              
              {/* Responsive grid for traffic controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-4 sm:gap-6">
                {/* Traffic Light */}
                <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                  <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Traffic Signal</h4>
                  <TrafficLight 
                    currentState={systemEnabled ? trafficLightState : 'off'} 
                    className="scale-75 sm:scale-90 md:scale-100 lg:scale-110"
                  />
                  <div className="flex items-center gap-2 text-xs sm:text-sm p-1.5 sm:p-2 bg-muted/30 rounded-lg w-full max-w-40 justify-center">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                      trafficLightState === 'red' ? 'bg-red-500 animate-pulse' :
                      trafficLightState === 'amber' ? 'bg-amber-500 animate-pulse' :
                      trafficLightState === 'green' ? 'bg-green-500' : 'bg-muted'
                    }`} />
                    <span className="capitalize font-medium text-xs">
                      {trafficLightState === 'off' ? 'Offline' : `${trafficLightState} Signal`}
                    </span>
                  </div>
                </div>

                {/* Pedestrian Call Button */}
                <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                  <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Pedestrian Call</h4>
                  <div className="scale-75 sm:scale-90 md:scale-100">
                    <PedestrianButton
                      onPress={handleButtonPress}
                      isActive={isButtonActive}
                      audioMessage={isButtonActive && trafficLightState === 'red' ? audioMessages[language].cross : audioMessages[language].wait}
                      language={language}
                      isCrossingSignal={isButtonActive && trafficLightState === 'red'}
                      audioEnabled={false}
                      onAudioToggle={handleAudioToggle}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm p-1.5 sm:p-2 bg-muted/30 rounded-lg w-full max-w-40 justify-center">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isButtonActive ? 'bg-blue-500 animate-pulse' : 'bg-muted'}`} />
                    <span className="font-medium text-xs">
                      {isButtonActive ? 'Request Active' : 'Ready'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Vehicle Detection */}
            <Card className="p-4 sm:p-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">AI Detection System</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Intelligent Safety Analysis</p>
              </div>
              
              <div className="scale-90 sm:scale-100">
                <VehicleDetection
                  isDetected={vehicleDetected}
                  vehicleSpeed={vehicleSpeed}
                  distanceToStop={distanceToStop}
                  canSafelyStop={canSafelyStop}
                  sensorSensitivity={sensorSensitivity}
                  isDecelerating={isDecelerating}
                  requiredStoppingDistance={requiredStoppingDistance}
                  decelerationRate={decelerationRate}
                  queueAnalysis={queueAnalysis}
                />
              </div>
            </Card>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <div className="text-xl sm:text-2xl font-bold text-primary">{averageVehicleCount}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Vehicles/min</div>
            </Card>
            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <div className="text-xl sm:text-2xl font-bold text-primary">{averageSpeed.toFixed(1)}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Avg Speed</div>
            </Card>
            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <div className="text-xl sm:text-2xl font-bold text-primary">{redLightDuration}s</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Signal Time</div>
            </Card>
            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <div className="text-xl sm:text-2xl font-bold text-primary">{sensorSensitivity}%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Sensitivity</div>
            </Card>
          </div>
        </section>

        {/* Command Center */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Command Center & Intelligence Hub</h2>
            <p className="text-muted-foreground">System controls, analytics, and health monitoring</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ControlPanel
              language={language}
              onLanguageToggle={() => setLanguage(prev => prev === 'en' ? 'fil' : 'en')}
              audioMessages={audioMessages}
              onAudioMessageChange={handleAudioMessageChange}
              redLightDuration={redLightDuration}
              onRedLightDurationChange={setRedLightDuration}
              sensorSensitivity={sensorSensitivity}
              onSensorSensitivityChange={setSensorSensitivity}
              systemEnabled={systemEnabled}
              onSystemToggle={() => setSystemEnabled(!systemEnabled)}
              onRunScenario={runScenario}
            />

            <TrafficAnalytics
              currentVehicleCount={averageVehicleCount}
              currentAverageSpeed={averageSpeed}
              currentRedDuration={redLightDuration}
              onOptimalDurationChange={setRedLightDuration}
            />

            <SystemHealth
              onManualOverride={handleManualOverride}
              onMaintenanceMode={handleMaintenanceMode}
            />
          </div>
        </section>

        {/* System Monitor */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Live System Monitor</h2>
            <p className="text-muted-foreground">Real-time activity logs and system events</p>
          </div>

          <SystemLogs 
            logs={logs} 
            onClearLogs={() => setLogs([])}
          />
        </section>

        {/* Documentation Footer */}
        <Card className="mt-8 glass bg-gradient-surface animate-fade-in" style={{animationDelay: '0.8s'}}>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              Enhanced Smart Features & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Accessibility className="w-5 h-5 text-status-success" />
                  Enhanced Vehicle Intelligence
                </h4>
                <div className="space-y-3">
                  {[
                    'Multi-vehicle queue detection',
                    'Emergency vehicle priority system', 
                    'Intelligent signal timing optimization',
                    'Real-time traffic flow analysis',
                    'Physics-based safety calculations'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                      <div className="w-2 h-2 bg-status-success rounded-full" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Predictive Intelligence
                </h4>
                <div className="space-y-3">
                  {[
                    'Machine learning traffic patterns',
                    'Weather condition adaptation',
                    'Time-of-day optimization',
                    'Historical data analysis',
                    'Predictive signal timing'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 text-status-warning" />
                  Fail-Safe & Redundancy
                </h4>
                <div className="space-y-3">
                  {[
                    'Backup sensor array systems',
                    'System health monitoring',
                    'Manual override controls',
                    'Maintenance mode operation',
                    'Power backup systems'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                      <div className="w-2 h-2 bg-status-warning rounded-full" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;

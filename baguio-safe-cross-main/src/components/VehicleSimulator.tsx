import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Truck, Bus, Play, Pause, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { queueDetector, VehicleInQueue, QueueAnalysis } from "@/lib/queueDetection";

interface DetectionData {
  hasVehicle: boolean;
  speed: number;
  distance: number;
  canStop: boolean;
  isDecelerating: boolean;
  requiredDistance: number;
  decelerationRate: number;
  queueAnalysis: QueueAnalysis | null;
}

interface Vehicle {
  id: string;
  type: 'car' | 'truck' | 'bus';
  speed: number;
  originalSpeed: number;
  position: number;
  color: string;
  size: 'small' | 'medium' | 'large';
  isStopped: boolean;
  isWaitingAtLight: boolean;
  previousSpeed?: number;
  previousPosition?: number;
  decelerationRate?: number;
  reactionTime?: number;
  isEmergency?: boolean;
}

interface Pedestrian {
  id: string;
  position: number;
  speed: number;
  type: 'adult' | 'elderly' | 'child';
  direction: 'top-to-bottom' | 'bottom-to-top';
}

interface VehicleSimulatorProps {
  onVehicleDetection: (
    detected: boolean, 
    speed: number, 
    distance: number, 
    canStop: boolean,
    isDecelerating?: boolean,
    requiredStoppingDistance?: number,
    decelerationRate?: number,
    queueAnalysis?: QueueAnalysis
  ) => void;
  isSimulationRunning: boolean;
  onToggleSimulation: () => void;
  trafficLightState: 'red' | 'amber' | 'green' | 'off';
  className?: string;
}

export const VehicleSimulator = ({
  onVehicleDetection,
  isSimulationRunning,
  onToggleSimulation,
  trafficLightState,
  className
}: VehicleSimulatorProps) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pedestrians, setPedestrians] = useState<Pedestrian[]>([]);
  const [sensorZones, setSensorZones] = useState([false, false, false]);
  const [queueAnalysis, setQueueAnalysis] = useState<QueueAnalysis | null>(null);
  
  const detectionDataRef = useRef<DetectionData>({ 
    hasVehicle: false, 
    speed: 0, 
    distance: 0, 
    canStop: true, 
    isDecelerating: false, 
    requiredDistance: 0, 
    decelerationRate: 0, 
    queueAnalysis: null 
  });

  // Vehicle templates
  const vehicleTypes = [
    { type: 'car' as const, speeds: [25, 35, 45], size: 'small' as const, colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'] },
    { type: 'truck' as const, speeds: [20, 30, 40], size: 'large' as const, colors: ['#6B7280', '#374151'] },
    { type: 'bus' as const, speeds: [15, 25, 35], size: 'large' as const, colors: ['#7C3AED', '#DC2626'] }
  ];

  // Enhanced physics calculations for safe stopping
  const calculateStoppingDistance = (vehicle: Vehicle): number => {
    const speedMps = vehicle.speed / 3.6;
    const reactionTime = vehicle.reactionTime || 1.5;
    
    let maxDeceleration: number;
    switch (vehicle.type) {
      case 'car': maxDeceleration = 7.0; break;
      case 'truck': maxDeceleration = 5.5; break;
      case 'bus': maxDeceleration = 5.0; break;
      default: maxDeceleration = 6.0;
    }
    
    const roadCondition = 0.9;
    const effectiveDeceleration = maxDeceleration * roadCondition;
    
    const reactionDistance = speedMps * reactionTime;
    const brakingDistance = (speedMps * speedMps) / (2 * effectiveDeceleration);
    const safetyBuffer = 5;
    
    return reactionDistance + brakingDistance + safetyBuffer;
  };

  const isVehicleDecelerating = (vehicle: Vehicle): boolean => {
    if (!vehicle.previousSpeed) return false;
    const speedChange = vehicle.previousSpeed - vehicle.speed;
    return speedChange > 0.5;
  };

  const calculateDecelerationRate = (vehicle: Vehicle): number => {
    if (!vehicle.previousSpeed || !vehicle.previousPosition) return 0;
    
    const speedChange = vehicle.previousSpeed - vehicle.speed;
    const timeInterval = 0.1;
    
    if (speedChange <= 0) return 0;
    
    const decelerationMps2 = (speedChange / 3.6) / timeInterval;
    return Math.max(0, decelerationMps2);
  };

  const createVehicle = (): Vehicle => {
    const template = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    const speed = template.speeds[Math.floor(Math.random() * template.speeds.length)];
    const color = template.colors[Math.floor(Math.random() * template.colors.length)];
    
    const isEmergency = Math.random() < 0.02;
    
    return {
      id: `vehicle-${Date.now()}-${Math.random()}`,
      type: template.type,
      speed: isEmergency ? speed + 20 : speed,
      originalSpeed: speed,
      position: -20,
      color: isEmergency ? '#FF0000' : color,
      size: template.size,
      isStopped: false,
      isWaitingAtLight: false,
      reactionTime: 1.2 + Math.random() * 0.6,
      decelerationRate: 0,
      isEmergency
    };
  };

  const createPedestrian = (): Pedestrian => {
    const types: Pedestrian['type'][] = ['adult', 'elderly', 'child'];
    const type = types[Math.floor(Math.random() * types.length)];
    const direction = Math.random() > 0.5 ? 'top-to-bottom' : 'bottom-to-top';
    
    let speed: number;
    switch (type) {
      case 'adult': speed = 2.0 + Math.random() * 0.5; break;
      case 'elderly': speed = 1.2 + Math.random() * 0.3; break;
      case 'child': speed = 1.8 + Math.random() * 0.4; break;
      default: speed = 2.0;
    }
    
    return {
      id: `pedestrian-${Date.now()}-${Math.random()}`,
      position: direction === 'top-to-bottom' ? -5 : 105,
      speed,
      type,
      direction
    };
  };

  // Effect to handle vehicle detection updates outside of render
  useEffect(() => {
    const data = detectionDataRef.current;
    onVehicleDetection(
      data.hasVehicle,
      data.speed,
      data.distance,
      data.canStop,
      data.isDecelerating,
      data.requiredDistance,
      data.decelerationRate,
      data.queueAnalysis
    );
  }, [vehicles, onVehicleDetection]);

  useEffect(() => {
    if (!isSimulationRunning) return;

    const interval = setInterval(() => {
      setVehicles(prevVehicles => {
        const updatedVehicles = prevVehicles.map(vehicle => {
          const previousSpeed = vehicle.speed;
          const previousPosition = vehicle.position;
          
          let newVehicle = { ...vehicle, previousSpeed, previousPosition };
          const stopLinePosition = 67;
          const crosswalkStart = 70;
          const crosswalkEnd = 80;
          
          if (trafficLightState === 'red' || trafficLightState === 'amber') {
            if (vehicle.position < stopLinePosition && vehicle.position > 30 && !vehicle.isWaitingAtLight) {
              const stoppingDistance = calculateStoppingDistance(vehicle);
              const distanceToStopLine = (stopLinePosition - vehicle.position) * 2;
              
              if (distanceToStopLine <= stoppingDistance + 10) {
                if (!vehicle.isStopped && vehicle.speed > 0) {
                  const decelerationRate = Math.min(6.0, vehicle.speed * 0.3);
                  newVehicle.speed = Math.max(0, vehicle.speed - decelerationRate);
                  newVehicle.decelerationRate = calculateDecelerationRate(newVehicle);
                  
                  if (newVehicle.speed <= 0.5 || vehicle.position >= stopLinePosition - 1) {
                    newVehicle.isStopped = true;
                    newVehicle.isWaitingAtLight = true;
                    newVehicle.speed = 0;
                    newVehicle.position = Math.min(vehicle.position, stopLinePosition);
                  }
                }
              }
            }
            
            if (vehicle.position >= crosswalkStart - 3 && vehicle.position < crosswalkEnd) {
              if (!vehicle.isWaitingAtLight) {
                newVehicle.isStopped = true;
                newVehicle.isWaitingAtLight = true;
                newVehicle.speed = 0;
                newVehicle.position = crosswalkStart - 3;
              }
            }
            
            if (vehicle.isWaitingAtLight) {
              newVehicle.position = Math.min(vehicle.position, stopLinePosition);
              newVehicle.speed = 0;
            }
          } else if (trafficLightState === 'green') {
            if (vehicle.isWaitingAtLight) {
              newVehicle.isStopped = false;
              newVehicle.isWaitingAtLight = false;
              newVehicle.speed = Math.min(vehicle.originalSpeed, vehicle.speed + 2);
            }
          }
          
          if (!newVehicle.isStopped) {
            newVehicle.position = vehicle.position + (newVehicle.speed * 0.1);
          }
          
          return newVehicle;
        }).filter(vehicle => vehicle.position < 120);

        const vehicleQueue: VehicleInQueue[] = updatedVehicles.map((vehicle, index) => ({
          id: vehicle.id,
          position: vehicle.position,
          speed: vehicle.speed,
          type: vehicle.type,
          isEmergency: vehicle.isEmergency || false,
          queuePosition: index + 1,
          canSafelyStop: calculateStoppingDistance(vehicle) <= (80 - vehicle.position) * 2,
          estimatedClearanceTime: 2 + (vehicle.type === 'truck' ? 2 : vehicle.type === 'bus' ? 1.5 : 0)
        }));

        const currentQueueAnalysis = queueDetector.analyzeVehicleQueue(vehicleQueue);
        setQueueAnalysis(currentQueueAnalysis);

        const newSensorZones = [false, false, false];
        let detectedVehicle: Vehicle | null = null;

        updatedVehicles.forEach(vehicle => {
          const isDetectable = !vehicle.isWaitingAtLight || vehicle.position <= 70;
          
          if (isDetectable) {
            if (vehicle.position >= 35 && vehicle.position <= 50) {
              newSensorZones[0] = true;
              if (!detectedVehicle || vehicle.position > detectedVehicle.position) {
                detectedVehicle = vehicle;
              }
            }
            if (vehicle.position >= 45 && vehicle.position <= 60) {
              newSensorZones[1] = true;
            }
            if (vehicle.position >= 55 && vehicle.position <= 70) {
              newSensorZones[2] = true;
            }
          }
        });

        setSensorZones(newSensorZones);

        if (detectedVehicle) {
          const distanceToStop = Math.max(0, (80 - detectedVehicle.position) * 2);
          const requiredStoppingDistance = calculateStoppingDistance(detectedVehicle);
          const isDecelerating = isVehicleDecelerating(detectedVehicle);
          
          let canSafelyStop = true;
          
          if (distanceToStop < requiredStoppingDistance) {
            canSafelyStop = false;
            
            if (isDecelerating && detectedVehicle.decelerationRate && detectedVehicle.decelerationRate > 3.0) {
              const speedMps = detectedVehicle.speed / 3.6;
              const projectedStoppingDistance = (speedMps * speedMps) / (2 * detectedVehicle.decelerationRate) + 3;
              canSafelyStop = projectedStoppingDistance <= distanceToStop;
            }
          }

          // Store detection data for useEffect
          detectionDataRef.current = {
            hasVehicle: true,
            speed: Math.round(detectedVehicle.speed),
            distance: Math.round(distanceToStop),
            canStop: canSafelyStop,
            isDecelerating,
            requiredDistance: Math.round(requiredStoppingDistance),
            decelerationRate: detectedVehicle.decelerationRate || 0,
            queueAnalysis: currentQueueAnalysis
          };
        } else {
          detectionDataRef.current = {
            hasVehicle: false,
            speed: 0,
            distance: 0,
            canStop: true,
            isDecelerating: false,
            requiredDistance: 0,
            decelerationRate: 0,
            queueAnalysis: currentQueueAnalysis
          };
        }

        return updatedVehicles;
      });

      setPedestrians(prevPedestrians => {
        if (trafficLightState !== 'red') {
          return [];
        }

        let updatedPedestrians = prevPedestrians.map(pedestrian => {
          let newPedestrian = { ...pedestrian };
          
          if (pedestrian.direction === 'top-to-bottom') {
            newPedestrian.position = pedestrian.position + (pedestrian.speed * 1.2);
          } else {
            newPedestrian.position = pedestrian.position - (pedestrian.speed * 1.2);
          }
          
          return newPedestrian;
        }).filter(pedestrian => 
          pedestrian.position > -15 && pedestrian.position < 115
        );

        if (trafficLightState === 'red' && updatedPedestrians.length < 3) {
          if (Math.random() < 0.02) {
            updatedPedestrians = [...updatedPedestrians, createPedestrian()];
          }
        }

        return updatedPedestrians;
      });

      const spawnRate = trafficLightState === 'red' ? 0.005 : 0.02;
      if (Math.random() < spawnRate) {
        setVehicles(prev => [...prev, createVehicle()]);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isSimulationRunning, trafficLightState]);

  const getVehicleIcon = (type: Vehicle['type']) => {
    switch (type) {
      case 'car': return Car;
      case 'truck': return Truck;
      case 'bus': return Bus;
      default: return Car;
    }
  };

  const getVehicleSize = (size: Vehicle['size']) => {
    switch (size) {
      case 'small': return 'w-8 h-4';
      case 'medium': return 'w-10 h-5';
      case 'large': return 'w-14 h-6';
      default: return 'w-8 h-4';
    }
  };

  const getPedestrianIcon = (type: Pedestrian['type']) => {
    switch (type) {
      case 'adult': return '🚶';
      case 'elderly': return '🚶‍♂️';
      case 'child': return '🧒';
      default: return '🚶';
    }
  };

  return (
    <Card className={cn("shadow-traffic", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Traffic Simulation
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSimulation}
            className="flex items-center gap-2"
          >
            {isSimulationRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isSimulationRunning ? 'Pause' : 'Start'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Live Traffic & Pedestrian Simulation</h4>
          
          <div className="relative w-full h-32 bg-gradient-to-r from-muted via-muted to-muted rounded-lg overflow-hidden border-2 border-border">
            <div className="absolute inset-0 flex">
              <div className="flex-1 border-r border-dashed border-border/50 relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border/30" />
              </div>
              <div className="flex-1 relative opacity-30">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border/30" />
              </div>
            </div>

            <div 
              className="absolute top-0 bottom-0 bg-gradient-to-r from-background/80 via-background/60 to-background/80 border-l-2 border-r-2 border-primary/30 z-5"
              style={{ left: '70%', width: '10%' }}
            >
              <div className="absolute inset-0 opacity-20 bg-repeating-linear-gradient bg-stripes" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-primary font-bold rotate-90">
                CROSSWALK
              </div>
            </div>

            <div 
              className="absolute top-0 bottom-0 w-1 bg-status-warning z-10"
              style={{ left: '67%' }}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs text-status-warning font-bold">
                STOP
              </div>
            </div>

            <div 
              className="absolute top-1 w-3 h-3 rounded-full transition-all duration-300 border border-border/50 z-10"
              style={{ 
                left: '82%',
                backgroundColor: trafficLightState === 'red' ? '#ef4444' : 
                               trafficLightState === 'amber' ? '#f59e0b' : 
                               trafficLightState === 'green' ? '#10b981' : '#6b7280'
              }}
            />

            {[40, 50, 60].map((position, index) => (
              <div
                key={index}
                className={cn(
                  "absolute top-0 bottom-0 w-1 transition-all duration-200 z-20",
                  sensorZones[index] ? "bg-status-active shadow-glow animate-pulse" : "bg-muted-foreground/30"
                )}
                style={{ left: `${position}%` }}
              >
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground">
                  S{index + 1}
                </div>
              </div>
            ))}

            {vehicles.map((vehicle, index) => {
              const VehicleIcon = getVehicleIcon(vehicle.type);
              return (
                <div
                  key={vehicle.id}
                  className={cn(
                    "absolute top-1/2 transform -translate-y-1/2 transition-all duration-100 flex items-center justify-center text-white font-bold text-xs rounded shadow-sm z-30",
                    getVehicleSize(vehicle.size),
                    vehicle.isStopped ? "animate-pulse" : "",
                    vehicle.isEmergency ? "ring-2 ring-red-500 animate-pulse" : ""
                  )}
                  style={{ 
                    left: `${Math.max(0, Math.min(95, vehicle.position))}%`,
                    top: index % 2 === 0 ? '20%' : '28%',
                    backgroundColor: vehicle.color,
                    border: vehicle.isWaitingAtLight ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.3)'
                  }}
                >
                  <VehicleIcon className="w-4 h-4" />
                  {vehicle.isStopped && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-status-warning font-bold">
                      STOP
                    </div>
                  )}
                  {vehicle.isEmergency && (
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-red-500 font-bold">
                      EMG
                    </div>
                  )}
                </div>
              );
            })}

            {pedestrians.map((pedestrian, index) => (
              <div
                key={pedestrian.id}
                className="absolute transition-all duration-200 z-40 animate-bounce"
                style={{
                  left: `${Math.max(70, Math.min(80, pedestrian.position))}%`,
                  top: pedestrian.direction === 'top-to-bottom' ? '75%' : '25%',
                  transform: 'translateX(-50%)',
                  fontSize: '16px'
                }}
              >
                <span className={pedestrian.direction === 'bottom-to-top' ? 'scale-x-[-1]' : ''}>
                  {getPedestrianIcon(pedestrian.type)}
                </span>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-primary font-medium">
                  {pedestrian.type === 'elderly' ? 'Elder' : pedestrian.type === 'child' ? 'Child' : 'Adult'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((sensor, index) => (
            <div key={sensor} className="flex flex-col items-center gap-1">
              <Badge
                variant={sensorZones[index] ? "destructive" : "secondary"}
                className="text-xs"
              >
                IR-{sensor}
              </Badge>
              <div className={cn(
                "w-4 h-4 rounded-full transition-all duration-200",
                sensorZones[index] ? "bg-status-active animate-pulse" : "bg-status-inactive"
              )} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Vehicle Traffic</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold text-primary">{vehicles.length}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold text-status-active">{vehicles.filter(v => v.isStopped).length}</div>
                <div className="text-xs text-muted-foreground">Stopped</div>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold text-status-warning">{sensorZones.filter(Boolean).length}</div>
                <div className="text-xs text-muted-foreground">Detected</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Pedestrian Activity</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold text-primary">{pedestrians.length}</div>
                <div className="text-xs text-muted-foreground">Crossing</div>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg">
                <div className={cn(
                  "text-lg font-bold",
                  trafficLightState === 'red' ? "text-status-active" : "text-status-warning"
                )}>
                  {trafficLightState === 'red' ? '✓' : '✗'}
                </div>
                <div className="text-xs text-muted-foreground">Safe</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1.5 bg-status-active rounded" />
            <span>IR Sensor Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1.5 bg-status-warning rounded" />
            <span>Stop Line</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🚶</span>
            <span>Pedestrians cross ONLY during red light</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1.5 bg-status-error rounded" />
            <span>Vehicles must stop before crosswalk</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
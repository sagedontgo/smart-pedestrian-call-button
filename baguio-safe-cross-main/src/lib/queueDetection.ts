// Enhanced Vehicle Queue Detection & Intelligence
export interface VehicleInQueue {
  id: string;
  position: number;
  speed: number;
  type: 'car' | 'truck' | 'bus';
  isEmergency: boolean;
  queuePosition: number; // 1st, 2nd, 3rd in queue
  canSafelyStop: boolean;
  estimatedClearanceTime: number; // seconds to clear intersection
}

export interface QueueAnalysis {
  queueLength: number;
  totalVehicles: number;
  hasEmergencyVehicle: boolean;
  estimatedClearanceTime: number;
  recommendedAction: 'allow_crossing' | 'delay_crossing' | 'emergency_override';
  reasoning: string;
}

class QueueDetectionSystem {
  private readonly intersectionZone = { start: 65, end: 85 }; // Position 65-85% is intersection
  private readonly approachZone = { start: 40, end: 65 }; // Position 40-65% is approach zone
  
  analyzeVehicleQueue(vehicles: VehicleInQueue[]): QueueAnalysis {
    // Filter vehicles in approach and intersection zones
    const approachingVehicles = vehicles.filter(v => 
      v.position >= this.approachZone.start && v.position <= this.approachZone.end
    );
    
    const vehiclesInIntersection = vehicles.filter(v =>
      v.position >= this.intersectionZone.start && v.position <= this.intersectionZone.end
    );
    
    // Assign queue positions
    const queuedVehicles = approachingVehicles
      .sort((a, b) => b.position - a.position) // Closest to intersection first
      .map((vehicle, index) => ({
        ...vehicle,
        queuePosition: index + 1
      }));
    
    const queueLength = queuedVehicles.length;
    const totalVehicles = vehicles.length;
    const hasEmergencyVehicle = vehicles.some(v => v.isEmergency);
    
    // Calculate estimated clearance time
    const estimatedClearanceTime = this.calculateClearanceTime(queuedVehicles, vehiclesInIntersection);
    
    // Determine recommended action
    const { action, reasoning } = this.determineRecommendedAction(
      queuedVehicles, 
      vehiclesInIntersection, 
      hasEmergencyVehicle,
      estimatedClearanceTime
    );
    
    return {
      queueLength,
      totalVehicles,
      hasEmergencyVehicle,
      estimatedClearanceTime,
      recommendedAction: action,
      reasoning
    };
  }
  
  private calculateClearanceTime(queuedVehicles: VehicleInQueue[], vehiclesInIntersection: VehicleInQueue[]): number {
    let clearanceTime = 0;
    
    // Time for vehicles currently in intersection to clear
    vehiclesInIntersection.forEach(vehicle => {
      const remainingDistance = 100 - vehicle.position; // Distance to exit
      const timeToExit = (remainingDistance * 2) / Math.max(vehicle.speed, 10); // Convert to seconds
      clearanceTime = Math.max(clearanceTime, timeToExit);
    });
    
    // Time for queued vehicles to clear intersection
    queuedVehicles.forEach((vehicle, index) => {
      const vehicleType = vehicle.type;
      let clearanceTimePerVehicle = 2; // Base time in seconds
      
      // Adjust based on vehicle type
      switch (vehicleType) {
        case 'car': clearanceTimePerVehicle = 2; break;
        case 'truck': clearanceTimePerVehicle = 4; break;
        case 'bus': clearanceTimePerVehicle = 3.5; break;
      }
      
      // Emergency vehicles get priority (faster clearance)
      if (vehicle.isEmergency) {
        clearanceTimePerVehicle *= 0.5;
      }
      
      clearanceTime += clearanceTimePerVehicle;
    });
    
    return Math.round(clearanceTime);
  }
  
  private determineRecommendedAction(
    queuedVehicles: VehicleInQueue[], 
    vehiclesInIntersection: VehicleInQueue[], 
    hasEmergencyVehicle: boolean,
    estimatedClearanceTime: number
  ): { action: QueueAnalysis['recommendedAction']; reasoning: string } {
    
    // Emergency vehicle override
    if (hasEmergencyVehicle) {
      return {
        action: 'emergency_override',
        reasoning: 'Emergency vehicle detected - maintain green light for priority passage'
      };
    }
    
    // Check if vehicles are trapped in intersection
    if (vehiclesInIntersection.length > 0) {
      return {
        action: 'delay_crossing',
        reasoning: `${vehiclesInIntersection.length} vehicle(s) still in intersection - wait for clearance`
      };
    }
    
    // Check if queue is too long (would block intersection during red light)
    if (queuedVehicles.length > 6) {
      return {
        action: 'delay_crossing',
        reasoning: `Queue too long (${queuedVehicles.length} vehicles) - risk of intersection blocking`
      };
    }
    
    // Check if any vehicle cannot safely stop
    const unsafeVehicles = queuedVehicles.filter(v => !v.canSafelyStop);
    if (unsafeVehicles.length > 0) {
      return {
        action: 'delay_crossing',
        reasoning: `${unsafeVehicles.length} vehicle(s) cannot stop safely - wait for clearance`
      };
    }
    
    // Check estimated clearance time vs pedestrian crossing needs
    if (estimatedClearanceTime > 15) {
      return {
        action: 'delay_crossing',
        reasoning: `Long clearance time (${estimatedClearanceTime}s) - optimize for traffic flow`
      };
    }
    
    // Safe to allow crossing
    return {
      action: 'allow_crossing',
      reasoning: `Safe conditions: ${queuedVehicles.length} vehicles can stop, clearance in ${estimatedClearanceTime}s`
    };
  }
  
  detectEmergencyVehicle(vehicle: VehicleInQueue, speed: number): boolean {
    // Simulate emergency vehicle detection
    // In real implementation, this would use audio pattern recognition,
    // flashing light detection, or V2I communication
    
    // Simple heuristic: fast vehicle with unusual speed pattern
    const isHighSpeed = speed > 60;
    const isErraticSpeed = Math.abs(vehicle.speed - speed) > 10;
    
    // Random emergency vehicle simulation (2% chance)
    const isSimulatedEmergency = Math.random() < 0.02;
    
    return isSimulatedEmergency || (isHighSpeed && isErraticSpeed);
  }
  
  optimizeSignalTiming(queueAnalysis: QueueAnalysis, weatherVisibility: number): number {
    let baseDuration = 25; // Standard red light duration
    
    // Adjust for queue length
    if (queueAnalysis.queueLength > 3) {
      baseDuration -= 3; // Shorter red light for heavy traffic
    }
    
    // Adjust for weather conditions
    if (weatherVisibility < 70) {
      baseDuration += 5; // More time in poor visibility
    }
    
    // Adjust for emergency vehicles
    if (queueAnalysis.hasEmergencyVehicle) {
      baseDuration = 15; // Minimal red light for emergency
    }
    
    return Math.max(15, Math.min(35, baseDuration));
  }
}

export const queueDetector = new QueueDetectionSystem();
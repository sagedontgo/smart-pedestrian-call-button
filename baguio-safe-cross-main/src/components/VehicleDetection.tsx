import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Gauge, Timer, Users, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QueueAnalysis } from "@/lib/queueDetection";

interface VehicleDetectionProps {
  isDetected: boolean;
  vehicleSpeed: number;
  distanceToStop: number;
  canSafelyStop: boolean;
  sensorSensitivity: number;
  isDecelerating?: boolean;
  requiredStoppingDistance?: number;
  decelerationRate?: number;
  queueAnalysis?: QueueAnalysis;
  className?: string;
}

export const VehicleDetection = ({
  isDetected,
  vehicleSpeed,
  distanceToStop,
  canSafelyStop,
  sensorSensitivity,
  isDecelerating = false,
  requiredStoppingDistance = 0,
  decelerationRate = 0,
  queueAnalysis,
  className
}: VehicleDetectionProps) => {
  const getStatusColor = () => {
    if (!isDetected) return "bg-status-inactive";
    if (canSafelyStop) return "bg-status-active";
    return "bg-status-warning";
  };

  const getStatusText = () => {
    if (!isDetected) return "No Vehicle";
    if (canSafelyStop) return "Safe to Stop";
    return "Unsafe to Stop";
  };

  return (
    <Card className={cn("shadow-traffic", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5" />
          Vehicle Detection System
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-4 h-4 rounded-full transition-all duration-300",
            getStatusColor(),
            isDetected && "animate-pulse"
          )} />
          <Badge 
            variant={canSafelyStop ? "default" : "destructive"}
            className="font-medium"
          >
            {getStatusText()}
          </Badge>
        </div>

        {/* Vehicle Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Speed</span>
              {isDecelerating && (
                <Badge variant="outline" className="text-xs bg-status-warning/10">
                  Slowing
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-primary">
              {vehicleSpeed}
              <span className="text-sm font-normal text-muted-foreground ml-1">km/h</span>
            </p>
            {isDecelerating && (
              <p className="text-xs text-status-warning">
                Decel: {decelerationRate.toFixed(1)} m/s²
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Distance</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {distanceToStop}
              <span className="text-sm font-normal text-muted-foreground ml-1">m</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Needs: {requiredStoppingDistance}m
            </p>
          </div>
        </div>

        {/* Sensor Status */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">IR Sensor Array</span>
            <Badge variant="outline" className="text-xs">
              Sensitivity: {sensorSensitivity}%
            </Badge>
          </div>
        </div>

        {/* Enhanced Queue Analysis */}
        {queueAnalysis && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <h4 className="text-sm font-semibold text-foreground">Smart Queue Analysis</h4>
            </div>
            
            <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{queueAnalysis.queueLength}</div>
                  <div className="text-xs text-muted-foreground">Queue Length</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-status-info">{queueAnalysis.estimatedClearanceTime}s</div>
                  <div className="text-xs text-muted-foreground">Clear Time</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Recommendation:</span>
                  <Badge 
                    variant={queueAnalysis.recommendedAction === 'allow_crossing' ? 'default' : 
                            queueAnalysis.recommendedAction === 'emergency_override' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {queueAnalysis.recommendedAction.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                
                {queueAnalysis.hasEmergencyVehicle && (
                  <div className="flex items-center gap-2 text-status-error text-xs">
                    <AlertTriangle className="w-3 h-3 animate-pulse" />
                    Emergency Vehicle Priority Active
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground bg-muted/10 p-2 rounded border">
                  {queueAnalysis.reasoning}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Traffic Intelligence Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            AI Decision Making
          </h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Queue Detection:</span>
              <span className="font-medium text-status-success">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Emergency Priority:</span>
              <span className={cn(
                "font-medium",
                queueAnalysis?.hasEmergencyVehicle ? "text-status-error" : "text-muted-foreground"
              )}>
                {queueAnalysis?.hasEmergencyVehicle ? 'ENGAGED' : 'Standby'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Pattern Learning:</span>
              <span className="font-medium text-status-info">Active</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((sensor) => (
              <div key={sensor} className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-3 h-3 rounded-full transition-all duration-200",
                  isDetected && sensor <= 2 ? "bg-status-active" : "bg-status-inactive"
                )} />
                <span className="text-xs text-muted-foreground">S{sensor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Assessment */}
        <div className={cn(
          "p-3 rounded-lg border-l-4 transition-all duration-300",
          canSafelyStop 
            ? "bg-status-active/10 border-status-active" 
            : "bg-status-warning/10 border-status-warning"
        )}>
          <p className="text-sm font-medium mb-1">Physics-Based Safety Assessment</p>
          <p className="text-xs text-muted-foreground mb-2">
            {canSafelyStop 
              ? isDecelerating 
                ? "Vehicle is decelerating and can stop safely"
                : "Vehicle can safely stop at current speed and distance"
              : isDecelerating
                ? "Vehicle is slowing but may still be too close to stop safely"
                : "Vehicle approaching too fast - delaying pedestrian signal"
            }
          </p>
          {isDetected && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Available:</span>
                <span className="font-mono">{distanceToStop}m</span>
              </div>
              <div className="flex justify-between">
                <span>Required:</span>
                <span className="font-mono">{requiredStoppingDistance}m</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
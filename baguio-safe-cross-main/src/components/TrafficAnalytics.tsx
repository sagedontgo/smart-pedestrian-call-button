import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Brain, 
  Clock, 
  CloudRain, 
  Eye, 
  BarChart3,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { trafficAnalyzer, TrafficData } from "@/lib/trafficPatterns";
import { cn } from "@/lib/utils";

interface TrafficAnalyticsProps {
  currentVehicleCount: number;
  currentAverageSpeed: number;
  currentRedDuration: number;
  onOptimalDurationChange: (duration: number) => void;
  className?: string;
}

export const TrafficAnalytics = ({
  currentVehicleCount,
  currentAverageSpeed,
  currentRedDuration,
  onOptimalDurationChange,
  className
}: TrafficAnalyticsProps) => {
  const [isLearning, setIsLearning] = useState(true);
  const [requestCount, setRequestCount] = useState(0);
  const [weatherData, setWeatherData] = useState<{ condition: 'clear' | 'rain' | 'fog' | 'snow', visibility: number }>({ condition: 'clear', visibility: 95 });
  const [prediction, setPrediction] = useState({ optimalDuration: 25, confidence: 0.2, reasoning: 'Initializing...' });
  const [patternSummary, setPatternSummary] = useState({ totalPatterns: 0, highConfidencePatterns: 0, recentDataPoints: 0 });

  // Simulate data collection and learning
  useEffect(() => {
    if (!isLearning) return;

    const interval = setInterval(() => {
      const now = new Date();
      const weather = trafficAnalyzer.getCurrentWeatherCondition();
      setWeatherData(weather);

      // Add data point to traffic analyzer
      const dataPoint: TrafficData = {
        timestamp: now.getTime(),
        hour: now.getHours(),
        dayOfWeek: now.getDay(),
        vehicleCount: currentVehicleCount,
        averageSpeed: currentAverageSpeed,
        requestCount: requestCount,
        weatherCondition: weather.condition,
        visibility: weather.visibility
      };

      trafficAnalyzer.addDataPoint(dataPoint);

      // Update predictions and summaries
      const newPrediction = trafficAnalyzer.getCurrentPrediction();
      setPrediction(newPrediction);
      setPatternSummary(trafficAnalyzer.getPatternSummary());

      // Increment request count simulation
      if (Math.random() < 0.1) {
        setRequestCount(prev => prev + 1);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isLearning, currentVehicleCount, currentAverageSpeed, requestCount]);

  const applyOptimalDuration = () => {
    onOptimalDurationChange(prediction.optimalDuration);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.7) return "text-status-success";
    if (confidence > 0.4) return "text-status-warning";
    return "text-status-error";
  };

  const getWeatherIcon = () => {
    switch (weatherData.condition) {
      case 'rain': return <CloudRain className="w-4 h-4" />;
      case 'fog': return <Eye className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  return (
    <Card className={cn("shadow-traffic", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Traffic Intelligence
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLearning(!isLearning)}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isLearning && "animate-spin")} />
            {isLearning ? 'Learning' : 'Paused'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Prediction */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Optimal Signal Timing</h4>
            <Badge 
              variant="outline" 
              className={cn("gap-1", getConfidenceColor(prediction.confidence))}
            >
              <TrendingUp className="w-3 h-3" />
              {Math.round(prediction.confidence * 100)}% confidence
            </Badge>
          </div>
          
          <div className="bg-muted/20 rounded-lg p-4 border border-border/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-primary">{prediction.optimalDuration}s</span>
              <Button 
                size="sm" 
                onClick={applyOptimalDuration}
                disabled={prediction.confidence < 0.3}
                className="flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Apply
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{prediction.reasoning}</p>
            
            {prediction.optimalDuration !== currentRedDuration && (
              <div className="mt-2 flex items-center gap-2 text-xs text-status-warning">
                <AlertTriangle className="w-3 h-3" />
                Current: {currentRedDuration}s, Suggested: {prediction.optimalDuration}s
              </div>
            )}
          </div>
        </div>

        {/* Environmental Conditions */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Environmental Conditions</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                {getWeatherIcon()}
                <span className="text-xs font-medium capitalize">{weatherData.condition}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Weather Impact
              </div>
            </div>
            <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4" />
                <span className="text-xs font-medium">{weatherData.visibility}%</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Visibility
              </div>
              <Progress 
                value={weatherData.visibility} 
                className="h-1 mt-1"
              />
            </div>
          </div>
        </div>

        {/* Learning Progress */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <h4 className="text-sm font-semibold text-foreground">Learning Progress</h4>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-bold text-primary">{patternSummary.totalPatterns}</div>
              <div className="text-muted-foreground">Patterns</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-status-success">{patternSummary.highConfidencePatterns}</div>
              <div className="text-muted-foreground">High Conf.</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-status-info">{patternSummary.recentDataPoints}</div>
              <div className="text-muted-foreground">Data Points</div>
            </div>
          </div>
          
          <Progress 
            value={(patternSummary.recentDataPoints / 100) * 100} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground text-center">
            Learning from traffic patterns • {requestCount} pedestrian requests recorded
          </div>
        </div>

        {/* Current Metrics */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Live Metrics</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle Count:</span>
              <span className="font-medium">{currentVehicleCount}/min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Speed:</span>
              <span className="font-medium">{currentAverageSpeed.toFixed(1)} km/h</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
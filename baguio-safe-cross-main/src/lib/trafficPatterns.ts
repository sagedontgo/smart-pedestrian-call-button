// Traffic Pattern Learning & Predictive Intelligence
export interface TrafficData {
  timestamp: number;
  hour: number;
  dayOfWeek: number;
  vehicleCount: number;
  averageSpeed: number;
  requestCount: number;
  weatherCondition: 'clear' | 'rain' | 'fog' | 'snow';
  visibility: number; // 0-100%
}

export interface TrafficPattern {
  timeSlot: string; // e.g., "Monday-08-09"
  averageVehicleCount: number;
  averageSpeed: number;
  requestFrequency: number;
  optimalRedDuration: number;
  confidence: number; // 0-1
}

class TrafficPatternAnalyzer {
  private data: TrafficData[] = [];
  private patterns: Map<string, TrafficPattern> = new Map();
  private readonly maxDataPoints = 1000;

  addDataPoint(data: TrafficData) {
    this.data.push(data);
    
    // Keep only recent data points
    if (this.data.length > this.maxDataPoints) {
      this.data = this.data.slice(-this.maxDataPoints);
    }
    
    this.updatePatterns();
  }

  private updatePatterns() {
    const groupedData = this.groupDataByTimeSlot();
    
    groupedData.forEach((dataPoints, timeSlot) => {
      if (dataPoints.length >= 5) { // Minimum data points for pattern recognition
        const pattern = this.calculatePattern(dataPoints);
        this.patterns.set(timeSlot, pattern);
      }
    });
  }

  private groupDataByTimeSlot(): Map<string, TrafficData[]> {
    const grouped = new Map<string, TrafficData[]>();
    
    this.data.forEach(point => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const timeSlot = `${dayNames[point.dayOfWeek]}-${point.hour.toString().padStart(2, '0')}`;
      
      if (!grouped.has(timeSlot)) {
        grouped.set(timeSlot, []);
      }
      grouped.get(timeSlot)!.push(point);
    });
    
    return grouped;
  }

  private calculatePattern(dataPoints: TrafficData[]): TrafficPattern {
    const avgVehicleCount = dataPoints.reduce((sum, p) => sum + p.vehicleCount, 0) / dataPoints.length;
    const avgSpeed = dataPoints.reduce((sum, p) => sum + p.averageSpeed, 0) / dataPoints.length;
    const avgRequestFreq = dataPoints.reduce((sum, p) => sum + p.requestCount, 0) / dataPoints.length;
    
    // Calculate optimal red duration based on traffic density and pedestrian needs
    let optimalDuration = 20; // Base duration
    
    if (avgVehicleCount > 15) {
      optimalDuration += 5; // More time for heavy traffic
    }
    if (avgRequestFreq > 2) {
      optimalDuration += 3; // More time for frequent pedestrian use
    }
    if (avgSpeed < 30) {
      optimalDuration -= 2; // Less time for slow traffic
    }
    
    optimalDuration = Math.max(15, Math.min(35, optimalDuration)); // Clamp between 15-35 seconds
    
    const confidence = Math.min(1, dataPoints.length / 20); // Higher confidence with more data
    
    return {
      timeSlot: dataPoints[0] ? `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dataPoints[0].dayOfWeek]}-${dataPoints[0].hour.toString().padStart(2, '0')}` : '',
      averageVehicleCount: avgVehicleCount,
      averageSpeed: avgSpeed,
      requestFrequency: avgRequestFreq,
      optimalRedDuration: optimalDuration,
      confidence
    };
  }

  getCurrentPrediction(): { optimalDuration: number; confidence: number; reasoning: string } {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlot = `${dayNames[dayOfWeek]}-${hour.toString().padStart(2, '0')}`;
    
    const pattern = this.patterns.get(timeSlot);
    
    if (pattern && pattern.confidence > 0.3) {
      return {
        optimalDuration: Math.round(pattern.optimalRedDuration),
        confidence: pattern.confidence,
        reasoning: `Based on ${Math.round(pattern.confidence * 100)}% historical data: ${pattern.averageVehicleCount.toFixed(1)} avg vehicles/min, ${pattern.requestFrequency.toFixed(1)} pedestrian requests/hour`
      };
    }
    
    // Fallback to time-based heuristics
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    let duration = 25; // Default
    if (isRushHour && !isWeekend) {
      duration = 30;
    } else if (isWeekend) {
      duration = 20;
    }
    
    return {
      optimalDuration: duration,
      confidence: 0.2,
      reasoning: `Heuristic: ${isRushHour ? 'Rush hour' : isWeekend ? 'Weekend' : 'Normal'} traffic pattern`
    };
  }

  getPatternSummary(): { totalPatterns: number; highConfidencePatterns: number; recentDataPoints: number } {
    const highConfidence = Array.from(this.patterns.values()).filter(p => p.confidence > 0.7).length;
    
    return {
      totalPatterns: this.patterns.size,
      highConfidencePatterns: highConfidence,
      recentDataPoints: this.data.length
    };
  }

  // Simulate weather detection (in real implementation, this would come from sensors)
  getCurrentWeatherCondition(): { condition: TrafficData['weatherCondition']; visibility: number } {
    // Simulate varying weather conditions
    const conditions: TrafficData['weatherCondition'][] = ['clear', 'rain', 'fog'];
    const weights = [0.7, 0.2, 0.1]; // 70% clear, 20% rain, 10% fog
    
    let random = Math.random();
    let selectedCondition: TrafficData['weatherCondition'] = 'clear';
    
    for (let i = 0; i < conditions.length; i++) {
      if (random < weights[i]) {
        selectedCondition = conditions[i];
        break;
      }
      random -= weights[i];
    }
    
    const visibility = selectedCondition === 'clear' ? 95 + Math.random() * 5 :
                      selectedCondition === 'rain' ? 70 + Math.random() * 20 :
                      40 + Math.random() * 30; // fog
    
    return { condition: selectedCondition, visibility: Math.round(visibility) };
  }
}

export const trafficAnalyzer = new TrafficPatternAnalyzer();

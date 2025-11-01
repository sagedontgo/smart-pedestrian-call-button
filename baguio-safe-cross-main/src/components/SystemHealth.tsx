import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  WifiOff, 
  Zap,
  Settings,
  RefreshCw,
  Radio,
  Camera,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemComponent {
  id: string;
  name: string;
  status: 'online' | 'degraded' | 'offline';
  health: number; // 0-100
  backup: boolean;
  lastCheck: number;
  errorCount: number;
}

interface SystemHealthProps {
  onManualOverride: () => void;
  onMaintenanceMode: () => void;
  className?: string;
}

export const SystemHealth = ({
  onManualOverride,
  onMaintenanceMode,
  className
}: SystemHealthProps) => {
  const [components, setComponents] = useState<SystemComponent[]>([
    { id: 'primary-ir', name: 'Primary IR Sensors', status: 'online', health: 98, backup: true, lastCheck: Date.now(), errorCount: 0 },
    { id: 'backup-ir', name: 'Backup IR Sensors', status: 'online', health: 95, backup: false, lastCheck: Date.now(), errorCount: 0 },
    { id: 'camera', name: 'Vision System', status: 'online', health: 92, backup: true, lastCheck: Date.now(), errorCount: 0 },
    { id: 'audio', name: 'Audio System', status: 'online', health: 88, backup: false, lastCheck: Date.now(), errorCount: 0 },
    { id: 'lights', name: 'Traffic Lights', status: 'online', health: 100, backup: true, lastCheck: Date.now(), errorCount: 0 },
    { id: 'network', name: 'Network Comm', status: 'online', health: 85, backup: false, lastCheck: Date.now(), errorCount: 0 },
    { id: 'power', name: 'Power System', status: 'online', health: 96, backup: true, lastCheck: Date.now(), errorCount: 0 },
    { id: 'control', name: 'Main Controller', status: 'online', health: 99, backup: true, lastCheck: Date.now(), errorCount: 0 }
  ]);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [overallHealth, setOverallHealth] = useState(95);
  const [redundancyStatus, setRedundancyStatus] = useState(true);

  // Simulate system health monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setComponents(prev => prev.map(component => {
        // Simulate occasional health fluctuations
        let newHealth = component.health;
        let newStatus = component.status;
        let newErrorCount = component.errorCount;

        // Random health variations
        const healthChange = (Math.random() - 0.5) * 4;
        newHealth = Math.max(0, Math.min(100, newHealth + healthChange));

        // Simulate occasional errors
        if (Math.random() < 0.02) { // 2% chance of error
          newErrorCount += 1;
          newHealth -= 5;
        }

        // Determine status based on health
        if (newHealth > 80) {
          newStatus = 'online';
        } else if (newHealth > 50) {
          newStatus = 'degraded';
        } else {
          newStatus = 'offline';
        }

        return {
          ...component,
          health: Math.round(newHealth),
          status: newStatus,
          errorCount: newErrorCount,
          lastCheck: Date.now()
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Calculate overall system health
  useEffect(() => {
    const totalHealth = components.reduce((sum, comp) => sum + comp.health, 0);
    const avgHealth = totalHealth / components.length;
    setOverallHealth(Math.round(avgHealth));

    // Check redundancy status
    const criticalComponents = components.filter(comp => comp.backup);
    const activeCritical = criticalComponents.filter(comp => comp.status === 'online');
    setRedundancyStatus(activeCritical.length >= criticalComponents.length * 0.8);
  }, [components]);

  const getStatusIcon = (status: SystemComponent['status']) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-status-success" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-status-warning" />;
      case 'offline': return <XCircle className="w-4 h-4 text-status-error" />;
    }
  };

  const getComponentIcon = (id: string) => {
    switch (id) {
      case 'primary-ir':
      case 'backup-ir': return <Radio className="w-4 h-4" />;
      case 'camera': return <Camera className="w-4 h-4" />;
      case 'audio': return <Radio className="w-4 h-4" />;
      case 'lights': return <Zap className="w-4 h-4" />;
      case 'network': return <WifiOff className="w-4 h-4" />;
      case 'power': return <Zap className="w-4 h-4" />;
      case 'control': return <Cpu className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const criticalIssues = components.filter(comp => comp.status === 'offline').length;
  const warnings = components.filter(comp => comp.status === 'degraded').length;

  return (
    <Card className={cn("shadow-traffic", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            System Health
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={overallHealth > 90 ? "default" : overallHealth > 70 ? "destructive" : "destructive"}
              className="gap-1"
            >
              {overallHealth}% Health
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">System Status</span>
            {redundancyStatus ? (
              <Badge variant="outline" className="text-status-success gap-1">
                <CheckCircle className="w-3 h-3" />
                Redundant
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                At Risk
              </Badge>
            )}
          </div>
          
          <Progress value={overallHealth} className="h-3" />
          
          {(criticalIssues > 0 || warnings > 0) && (
            <Alert className="border-status-warning/30 bg-status-warning/5">
              <AlertTriangle className="h-4 w-4 text-status-warning" />
              <AlertDescription className="text-sm">
                {criticalIssues > 0 && `${criticalIssues} critical issue${criticalIssues > 1 ? 's' : ''}`}
                {criticalIssues > 0 && warnings > 0 && ', '}
                {warnings > 0 && `${warnings} warning${warnings > 1 ? 's' : ''}`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Component Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Component Status</h4>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {components.map(component => (
              <div key={component.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30">
                <div className="flex items-center gap-3">
                  {getComponentIcon(component.id)}
                  <div>
                    <div className="text-sm font-medium">{component.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {component.errorCount > 0 && `${component.errorCount} errors • `}
                      Last check: {new Date(component.lastCheck).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono">{component.health}%</span>
                  {getStatusIcon(component.status)}
                  {component.backup && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      BACKUP
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Manual Controls</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onManualOverride}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Override
            </Button>
            
            <Button
              variant={maintenanceMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setMaintenanceMode(!maintenanceMode);
                onMaintenanceMode();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Maintenance
            </Button>
          </div>
          
          {maintenanceMode && (
            <Alert className="border-status-info/30 bg-status-info/5">
              <RefreshCw className="h-4 w-4 text-status-info" />
              <AlertDescription className="text-sm">
                Maintenance mode active. System operating with degraded functionality.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Backup Systems */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Backup Status</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Sensor Redundancy:</span>
              <span className={cn(
                "font-medium",
                components.find(c => c.id === 'backup-ir')?.status === 'online' ? "text-status-success" : "text-status-error"
              )}>
                {components.find(c => c.id === 'backup-ir')?.status === 'online' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Power Backup:</span>
              <span className={cn(
                "font-medium",
                components.find(c => c.id === 'power')?.health > 90 ? "text-status-success" : "text-status-warning"
              )}>
                {components.find(c => c.id === 'power')?.health}% Charged
              </span>
            </div>
            <div className="flex justify-between">
              <span>Failsafe Mode:</span>
              <span className="font-medium text-status-success">Ready</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
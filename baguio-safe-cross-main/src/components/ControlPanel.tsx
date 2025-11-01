import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings, Languages, Volume2, Timer } from "lucide-react";

interface ControlPanelProps {
  language: 'en' | 'fil';
  onLanguageToggle: () => void;
  audioMessages: {
    en: { wait: string; cross: string };
    fil: { wait: string; cross: string };
  };
  onAudioMessageChange: (lang: 'en' | 'fil', type: 'wait' | 'cross', message: string) => void;
  redLightDuration: number;
  onRedLightDurationChange: (duration: number) => void;
  sensorSensitivity: number;
  onSensorSensitivityChange: (sensitivity: number) => void;
  systemEnabled: boolean;
  onSystemToggle: () => void;
  onRunScenario: (scenario: 'safe' | 'unsafe') => void;
}

export const ControlPanel = ({
  language,
  onLanguageToggle,
  audioMessages,
  onAudioMessageChange,
  redLightDuration,
  onRedLightDurationChange,
  sensorSensitivity,
  onSensorSensitivityChange,
  systemEnabled,
  onSystemToggle,
  onRunScenario
}: ControlPanelProps) => {
  return (
    <Card className="shadow-traffic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          System Control Panel
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* System Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${systemEnabled ? 'bg-status-active' : 'bg-status-inactive'}`} />
            <Label>System Status</Label>
          </div>
          <Switch 
            checked={systemEnabled} 
            onCheckedChange={onSystemToggle}
          />
        </div>

        {/* Language Control */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4" />
            <Label>Language / Wika</Label>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => language === 'fil' && onLanguageToggle()}
            >
              English
            </Button>
            <Button
              variant={language === 'fil' ? 'default' : 'outline'}
              size="sm"
              onClick={() => language === 'en' && onLanguageToggle()}
            >
              Filipino
            </Button>
          </div>
        </div>

        {/* Audio Messages */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <Label>Audio Messages</Label>
            <Badge variant="outline" className="text-xs">
              {language === 'en' ? 'English' : 'Filipino'}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Wait Message</Label>
              <Textarea
                value={audioMessages[language].wait}
                onChange={(e) => onAudioMessageChange(language, 'wait', e.target.value)}
                className="mt-1 min-h-[60px]"
                placeholder="Enter wait message..."
              />
            </div>
            
            <div>
              <Label className="text-sm">Cross Message</Label>
              <Textarea
                value={audioMessages[language].cross}
                onChange={(e) => onAudioMessageChange(language, 'cross', e.target.value)}
                className="mt-1 min-h-[60px]"
                placeholder="Enter cross message..."
              />
            </div>
          </div>
        </div>

        {/* Timing Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <Label>Red Light Duration: {redLightDuration}s</Label>
          </div>
          <Slider
            value={[redLightDuration]}
            onValueChange={(value) => onRedLightDurationChange(value[0])}
            min={10}
            max={60}
            step={5}
            className="w-full"
          />
        </div>

        {/* Sensor Sensitivity */}
        <div className="space-y-4">
          <Label>Sensor Sensitivity: {sensorSensitivity}%</Label>
          <Slider
            value={[sensorSensitivity]}
            onValueChange={(value) => onSensorSensitivityChange(value[0])}
            min={50}
            max={100}
            step={10}
            className="w-full"
          />
        </div>

        {/* Scenario Testing */}
        <div className="space-y-3">
          <Label className="font-medium">Test Scenarios</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRunScenario('safe')}
              className="text-xs"
            >
              Safe Crossing
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRunScenario('unsafe')}
              className="text-xs"
            >
              Unsafe Speed
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
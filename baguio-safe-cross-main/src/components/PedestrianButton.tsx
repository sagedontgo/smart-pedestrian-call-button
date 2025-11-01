import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Vibrate, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { audioManager } from "@/lib/audioManager";

interface PedestrianButtonProps {
  onPress: () => void;
  isActive: boolean;
  audioMessage: string;
  language: 'en' | 'fil';
  isCrossingSignal?: boolean;
  audioEnabled?: boolean;
  onAudioToggle?: () => void;
  className?: string;
}

export const PedestrianButton = ({ 
  onPress, 
  isActive, 
  audioMessage, 
  language,
  isCrossingSignal = false,
  audioEnabled = true,
  onAudioToggle,
  className 
}: PedestrianButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Play audio when button state changes
  useEffect(() => {
    if (audioEnabled && audioMessage) {
      setIsPlayingAudio(true);
      audioManager.playAudioCue(audioMessage, language, isCrossingSignal)
        .finally(() => setIsPlayingAudio(false));
    }
  }, [audioMessage, language, isCrossingSignal, audioEnabled]);

  const handlePress = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
    onPress();
  };

  const brailleText = language === 'en' ? '⠠⠉⠁⠇⠇' : '⠠⠞⠥⠙⠚⠊';
  
  return (
    <div className={cn("glass p-8 rounded-3xl shadow-lg bg-gradient-surface backdrop-blur-sm animate-fade-in", className)}>
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-high-contrast mb-3 tracking-tight">
          {language === 'en' ? 'PEDESTRIAN CALL' : 'TAWAG NG TAGA-LAKAD'}
        </h3>
        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
          <p className="text-3xl font-mono tracking-wider text-primary mb-2">
            {brailleText}
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            {language === 'en' ? 'Braille Touch Surface' : 'Braille na Hawakan'}
          </p>
        </div>
      </div>

      <Button
        onClick={handlePress}
        size="lg"
        className={cn(
          "w-40 h-40 rounded-full text-xl font-bold transition-all duration-smooth shadow-button relative overflow-hidden group",
          isPressed && "scale-95",
          isActive ? 
            "bg-gradient-primary hover:bg-gradient-primary text-primary-foreground border-4 border-primary-glow shadow-glow animate-glow-pulse" : 
            "bg-secondary hover:bg-accent text-secondary-foreground border-4 border-border hover:border-primary/30",
        )}
      >
        <div className="flex flex-col items-center gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <Volume2 className={cn(
              "w-10 h-10 transition-all duration-smooth", 
              isPlayingAudio && "animate-pulse text-status-active scale-110"
            )} />
            <Vibrate className={cn(
              "w-10 h-10 transition-all duration-smooth", 
              isActive && "animate-bounce"
            )} />
          </div>
          <span className="text-base font-semibold tracking-wide">
            {language === 'en' ? 'PRESS' : 'PINDUTIN'}
          </span>
        </div>
        
        {/* Ripple effect */}
        {isPressed && (
          <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
        )}
      </Button>

      <div className="mt-8 p-6 bg-gradient-surface rounded-2xl border border-border/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Volume2 className="w-5 h-5 text-primary" />
            </div>
            <span className="text-base font-semibold text-foreground">Audio Cue</span>
          </div>
          {onAudioToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAudioToggle}
              className={cn(
                "h-10 w-10 p-0 rounded-full transition-all duration-smooth",
                audioEnabled ? "hover:bg-status-active/10" : "hover:bg-muted"
              )}
            >
              {audioEnabled ? 
                <Volume2 className="w-5 h-5 text-status-active" /> : 
                <VolumeX className="w-5 h-5 text-status-inactive" />
              }
            </Button>
          )}
        </div>
        <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
          <p className="text-sm text-muted-foreground leading-relaxed">
            "{audioMessage}"
          </p>
        </div>
        {isPlayingAudio && (
          <div className="mt-3 flex items-center gap-3 text-sm text-status-active animate-fade-in">
            <div className="w-2 h-2 bg-status-active rounded-full animate-pulse" />
            <span className="font-medium">Playing audio announcement...</span>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30">
          <div className={cn(
            "w-3 h-3 rounded-full transition-all duration-smooth",
            audioEnabled && isPlayingAudio ? "bg-status-active animate-pulse shadow-[0_0_10px_hsl(var(--status-active)/0.5)]" : 
            audioEnabled ? "bg-status-active" : "bg-status-inactive"
          )} />
          <span className="text-sm font-medium">
            {language === 'en' ? 'Audio' : 'Tunog'}
          </span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30">
          <div className={cn(
            "w-3 h-3 rounded-full transition-all duration-smooth",
            isActive ? "bg-status-active animate-pulse shadow-[0_0_10px_hsl(var(--status-active)/0.5)]" : "bg-status-inactive"
          )} />
          <span className="text-sm font-medium">
            {language === 'en' ? 'Vibration' : 'Panginginig'}
          </span>
        </div>
      </div>
    </div>
  );
};
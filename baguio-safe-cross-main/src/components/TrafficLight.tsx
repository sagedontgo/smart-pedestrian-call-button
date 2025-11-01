import { cn } from "@/lib/utils";

interface TrafficLightProps {
  currentState: 'red' | 'amber' | 'green' | 'off';
  className?: string;
}

export const TrafficLight = ({ currentState, className }: TrafficLightProps) => {
  const getLightState = (color: 'red' | 'amber' | 'green') => {
    const isActive = currentState === color;
    const baseClasses = "w-20 h-20 rounded-full transition-all duration-300 border-4";
    
    if (isActive) {
      switch (color) {
        case 'red':
          return `${baseClasses} bg-traffic-red border-traffic-red-glow shadow-[0_0_30px_hsl(var(--traffic-red)/0.8)] animate-glow-pulse`;
        case 'amber':
          return `${baseClasses} bg-traffic-amber border-traffic-amber-glow shadow-[0_0_30px_hsl(var(--traffic-amber)/0.8)] animate-glow-pulse`;
        case 'green':
          return `${baseClasses} bg-traffic-green border-traffic-green-glow shadow-[0_0_30px_hsl(var(--traffic-green)/0.8)] animate-glow-pulse`;
      }
    }
    
    return `${baseClasses} bg-muted/30 border-border opacity-20`;
  };

  return (
    <div className={cn(
      "glass p-8 rounded-3xl shadow-traffic border-2 bg-gradient-surface backdrop-blur-sm",
      className
    )}>
      <div className="flex flex-col gap-6">
        {/* Red Light */}
        <div className={getLightState('red')} />
        
        {/* Amber Light */}
        <div className={getLightState('amber')} />
        
        {/* Green Light */}
        <div className={getLightState('green')} />
      </div>
      
      <div className="mt-6 text-center">
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold tracking-wide",
          currentState === 'off' ? 
            "bg-muted/50 border-border text-muted-foreground" : 
            "bg-primary/10 border-primary/20 text-primary"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full",
            currentState === 'off' ? 'bg-muted-foreground' : 'bg-primary animate-pulse'
          )} />
          {currentState === 'off' ? 'SYSTEM OFF' : currentState.toUpperCase()}
        </div>
      </div>
    </div>
  );
};
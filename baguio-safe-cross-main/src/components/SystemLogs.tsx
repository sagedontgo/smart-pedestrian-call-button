import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  details?: string;
}

interface SystemLogsProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  className?: string;
}

export const SystemLogs = ({ logs, onClearLogs, className }: SystemLogsProps) => {
  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'bg-status-active text-white';
      case 'warning': return 'bg-status-warning text-white';
      case 'error': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      default: return 'ℹ';
    }
  };

  return (
    <Card className={cn("shadow-traffic", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          System Activity Log
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearLogs}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-64 w-full">
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No system activity recorded</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <Badge
                    className={cn(
                      "h-6 w-6 p-0 flex items-center justify-center text-xs font-bold shrink-0",
                      getLogColor(log.type)
                    )}
                  >
                    {getLogIcon(log.type)}
                  </Badge>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{log.message}</p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
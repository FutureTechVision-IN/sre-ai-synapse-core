
type LogLevel = 'info' | 'warn' | 'error' | 'critical';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
}

class TelemetryService {
    private static instance: TelemetryService;
    private logs: LogEntry[] = [];
    private readonly MAX_LOGS = 1000;

    private constructor() {}

    public static getInstance(): TelemetryService {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService();
        }
        return TelemetryService.instance;
    }

    private addLog(level: LogLevel, message: string, context?: Record<string, any>) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context
        };

        console.log(`[${level.toUpperCase()}] ${message}`, context || '');
        
        this.logs.unshift(entry);
        if (this.logs.length > this.MAX_LOGS) {
            this.logs.pop();
        }
    }

    public info(message: string, context?: Record<string, any>) {
        this.addLog('info', message, context);
    }

    public warn(message: string, context?: Record<string, any>) {
        this.addLog('warn', message, context);
    }

    public error(message: string, error?: any) {
        this.addLog('error', message, { error: error?.toString(), stack: error?.stack });
    }

    public critical(message: string, error?: any) {
        this.addLog('critical', message, { error: error?.toString(), stack: error?.stack });
        // In a real app, this would trigger an immediate alert call
    }

    public getLogs(): LogEntry[] {
        return this.logs;
    }

    public measurePerformance(metricName: string, value: number) {
        this.info(`perf: ${metricName}`, { value });
    }
}

export const telemetry = TelemetryService.getInstance();

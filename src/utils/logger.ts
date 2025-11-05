import { LogEntry } from '../types';

class Logger {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private maxLogs = 1000;

  private createLog(
    level: LogEntry['level'],
    action: string,
    details?: any,
    error?: string,
    stackTrace?: string
  ): LogEntry {
    const log: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      action,
      details,
      error,
      stackTrace,
    };

    this.logs.unshift(log);
    
    // 최대 로그 개수 유지
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // 리스너에게 알림
    this.notifyListeners();
    
    // 콘솔에도 출력
    this.logToConsole(log);

    return log;
  }

  private logToConsole(log: LogEntry) {
    const timestamp = new Date(log.timestamp).toLocaleTimeString('ko-KR');
    const prefix = `[${timestamp}] [${log.level.toUpperCase()}]`;
    
    switch (log.level) {
      case 'info':
        console.log(prefix, log.action, log.details || '');
        break;
      case 'success':
        console.log(`%c${prefix} ${log.action}`, 'color: #10b981', log.details || '');
        break;
      case 'warning':
        console.warn(prefix, log.action, log.details || '');
        break;
      case 'error':
        console.error(prefix, log.action, log.error || '', log.stackTrace || '');
        break;
    }
  }

  info(action: string, details?: any) {
    return this.createLog('info', action, details);
  }

  success(action: string, details?: any) {
    return this.createLog('success', action, details);
  }

  warning(action: string, details?: any) {
    return this.createLog('warning', action, details);
  }

  error(action: string, error: Error | string, details?: any) {
    const errorMessage = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : undefined;
    return this.createLog('error', action, details, errorMessage, stackTrace);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();


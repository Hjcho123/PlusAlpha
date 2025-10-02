import fs from 'fs';
import path from 'path';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

class Logger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
  }

  private writeToFile(message: string): void {
    try {
      fs.appendFileSync(this.logFile, message);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output
    const consoleMessage = formattedMessage.trim();
    switch (level) {
      case LogLevel.ERROR:
        console.error(consoleMessage);
        break;
      case LogLevel.WARN:
        console.warn(consoleMessage);
        break;
      case LogLevel.INFO:
        console.info(consoleMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(consoleMessage);
        break;
    }

    // File output (only in production or when explicitly enabled)
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
      this.writeToFile(formattedMessage);
    }
  }

  error(message: string, meta?: any): void {
    this.log(LogLevel.ERROR, message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, message, meta);
  }

  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  // HTTP request logger
  httpRequest(req: any, res: any, responseTime: number): void {
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms`;
    this.info(message, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  }

  // Database operation logger
  dbOperation(operation: string, collection: string, duration?: number): void {
    const message = `DB ${operation} on ${collection}`;
    this.debug(message, { operation, collection, duration });
  }

  // AI service logger
  aiOperation(operation: string, symbol?: string, duration?: number): void {
    const message = `AI ${operation}${symbol ? ` for ${symbol}` : ''}`;
    this.info(message, { operation, symbol, duration });
  }

  // WebSocket logger
  wsEvent(event: string, clientId?: string, data?: any): void {
    const message = `WS ${event}${clientId ? ` - Client: ${clientId}` : ''}`;
    this.debug(message, { event, clientId, data });
  }
}

export const logger = new Logger();

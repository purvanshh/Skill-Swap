import { createWriteStream } from 'fs';
import { join } from 'path';

// Log levels
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private level: LogLevel;
  private logFile?: NodeJS.WritableStream;

  constructor() {
    this.level = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    
    // In production, you might want to write to log files
    if (process.env.NODE_ENV === 'production' && process.env.LOG_FILE) {
      this.logFile = createWriteStream(join(process.cwd(), 'logs', 'app.log'), { flags: 'a' });
    }
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    if (level > this.level) return;

    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level].padEnd(5);
    const logMessage = `[${timestamp}] ${levelStr} ${message}`;
    
    // Add metadata if provided
    const fullMessage = meta ? `${logMessage} ${JSON.stringify(meta)}` : logMessage;

    // Console output (with colors in development)
    if (process.env.NODE_ENV !== 'production') {
      const colors = {
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.INFO]: '\x1b[36m',  // Cyan
        [LogLevel.DEBUG]: '\x1b[35m', // Magenta
      };
      
      console.log(`${colors[level]}${fullMessage}\x1b[0m`);
    } else {
      console.log(fullMessage);
    }

    // File output (if configured)
    if (this.logFile) {
      this.logFile.write(`${fullMessage}\n`);
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

  // HTTP request logging helper
  request(method: string, url: string, statusCode: number, duration: number, userAgent?: string): void {
    const message = `${method} ${url} ${statusCode} - ${duration}ms`;
    const meta = userAgent ? { userAgent } : undefined;
    
    if (statusCode >= 500) {
      this.error(message, meta);
    } else if (statusCode >= 400) {
      this.warn(message, meta);
    } else {
      this.info(message, meta);
    }
  }
}

export const logger = new Logger();
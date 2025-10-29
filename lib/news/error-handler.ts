// Error types
export class NewsFetchError extends Error {
  constructor(
    message: string,
    public code: string = 'NEWS_FETCH_ERROR',
    public cause?: unknown
  ) {
    super(message);
    this.name = 'NewsFetchError';
  }
}

export class ValidationError extends NewsFetchError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class DuplicateError extends NewsFetchError {
  constructor(message: string, public duplicateField: string) {
    super(message, 'DUPLICATE_ERROR');
    this.name = 'DuplicateError';
  }
}

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Log entry
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  category: string;
  data?: any;
  error?: Error;
}

/**
 * Logger class
 */
class NewsLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private shouldLog(level: LogLevel): boolean {
    const minLevel = process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : LogLevel.INFO;
    return level >= minLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    category: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message,
      category,
      data,
      error,
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    this.logToConsole(entry);
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const levelName = LogLevel[entry.level];
    const prefix = `[${entry.timestamp.toISOString()}] ${levelName} [${entry.category}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.error || entry.data);
        break;
    }
  }

  debug(message: string, category: string, data?: any): void {
    this.addLog(this.createLogEntry(LogLevel.DEBUG, message, category, data));
  }

  info(message: string, category: string, data?: any): void {
    this.addLog(this.createLogEntry(LogLevel.INFO, message, category, data));
  }

  warn(message: string, category: string, data?: any): void {
    this.addLog(this.createLogEntry(LogLevel.WARN, message, category, data));
  }

  error(message: string, category: string, error?: Error, data?: any): void {
    this.addLog(this.createLogEntry(LogLevel.ERROR, message, category, data, error));
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }
}

/**
 * Global logger instance
 */
export const logger = new NewsLogger();

/**
 * Error handler utility
 */
export class ErrorHandler {
  static handle(error: Error | unknown, context: string, data?: Record<string, any>): NewsFetchError {
    if (error instanceof NewsFetchError) {
      const errorMessage = error.message;
      // Log the error with the correct signature
      logger.error(
        `Handled error in ${context}: ${errorMessage}`,
        'ERROR_HANDLER',
        new Error(errorMessage),
        { ...(data || {}) }
      );
      return error;
    }

    if (error instanceof Error) {
      // Log the error with the correct signature
      logger.error(
        `Unexpected error in ${context}: ${error.message}`,
        'ERROR_HANDLER',
        error,
        { ...(data || {}) }
      );

      // Convert to appropriate NewsFetchError
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        return new DuplicateError(error.message, 'unknown');
      }

      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return new ValidationError(error.message);
      }

      return new NewsFetchError(error.message, 'UNEXPECTED_ERROR', error);
    }

    const unknownError = new NewsFetchError(
      `Unknown error in ${context}: ${String(error)}`,
      'UNKNOWN_ERROR'
    );

    logger.error(`Unknown error in ${context}`, 'ERROR_HANDLER', unknownError, { originalError: error, data });
    return unknownError;
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = 3,
    delay: number = 1000,
    data?: any
  ): Promise<T> {
    let lastError: NewsFetchError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`Attempt ${attempt}/${maxRetries} for ${context}`, 'RETRY', data);
        return await operation();
      } catch (error) {
        lastError = this.handle(error, `${context}_attempt_${attempt}`, data);

        if (attempt === maxRetries) {
          logger.error(`All retry attempts failed for ${context}`, 'RETRY', lastError, data);
          throw lastError;
        }

        const waitTime = delay * Math.pow(2, attempt - 1); // Exponential backoff
        logger.warn(`Retrying ${context} in ${waitTime}ms (attempt ${attempt})`, 'RETRY', { waitTime, data });
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError!;
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private static metrics: Map<string, { count: number; totalTime: number; errors: number }> = new Map();

  static startTimer(operation: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration);
    };
  }

  static recordMetric(operation: string, duration: number, error: boolean = false): void {
    const existing = this.metrics.get(operation) || { count: 0, totalTime: 0, errors: 0 };

    existing.count++;
    existing.totalTime += duration;

    if (error) {
      existing.errors++;
    }

    this.metrics.set(operation, existing);

    logger.debug(`Performance metric: ${operation}`, 'PERFORMANCE', {
      duration,
      average: existing.totalTime / existing.count,
      errorRate: existing.errors / existing.count,
    });
  }

  static getMetrics(): Record<string, { count: number; averageTime: number; errorRate: number }> {
    const result: Record<string, { count: number; averageTime: number; errorRate: number }> = {};

    this.metrics.forEach((metric, operation) => {
      result[operation] = {
        count: metric.count,
        averageTime: metric.totalTime / metric.count,
        errorRate: metric.errors / metric.count,
      };
    });

    return result;
  }

  static resetMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static sanitizeString(str: string, maxLength: number = 1000): string {
    return str
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .substring(0, maxLength);
  }

  static isValidImageUrl(url: string): boolean {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();

    return validExtensions.some(ext => pathname.endsWith(ext)) ||
           url.includes('image') ||
           /\.(jpg|jpeg|png|gif|webp)$/i.test(pathname);
  }
}

/**
 * Memory usage monitoring
 */
export class MemoryMonitor {
  static getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  static logMemoryUsage(context: string): void {
    const usage = this.getMemoryUsage();

    logger.info(`Memory usage in ${context}`, 'MEMORY', {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
    });
  }

  static isMemoryCritical(thresholdMB: number = 512): boolean {
    const usage = this.getMemoryUsage();
    const usageMB = usage.heapUsed / 1024 / 1024;
    return usageMB > thresholdMB;
  }
}

import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import DailyRotateFile from 'winston-daily-rotate-file';

import type { ILogger, LoggerConfig } from './logger.interface';

const {
  combine,
  timestamp,
  printf,
  colorize,
  uncolorize,
  metadata,
} = format;

// 日志根目录
const LOG_DIR = join(process.cwd(), '.selize', 'logs');

// 创建日志目录
const ensureLogDirectory = () => {
  const dirs = [
    LOG_DIR,
    join(LOG_DIR, 'error'),
    join(LOG_DIR, 'warn'),
    join(LOG_DIR, 'info'),
    join(LOG_DIR, 'debug'),
  ];

  dirs.forEach((dir) => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });
};

ensureLogDirectory();

const logFormat = printf(({ level, message, timestamp, ...rest }) => {
  let metaStr = '';

  const metadata = Object.keys(rest).length > 0 ? rest : null;

  if (metadata) {
    try {
      metaStr = ` ${JSON.stringify(metadata)}`;
    } catch (error) {
      metaStr = '[Connot stringify metadata]';
    }
  }
  return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
});

export class Logger implements ILogger {
  private logger;
  private readonly _env: string;
  private readonly _level: string;

  constructor(config?: LoggerConfig) {
    const {
      env = process.env.NODE_ENV || 'development',
      level = process.env.LOG_LEVEL || 'debug'
    } = config || {};

    this._env = env;
    this._level = level;

    const transportList = [
      new DailyRotateFile({
        filename: join(LOG_DIR, 'error', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD HH:mm:ss',
        level: 'error',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      }),
      new DailyRotateFile({
        filename: join(LOG_DIR, 'warn', 'warn-%DATE%.log'),
        datePattern: 'YYYY-MM-DD HH:mm:ss',
        level: 'warn',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      }),
      new DailyRotateFile({
        filename: join(LOG_DIR, 'info', 'info-%DATE%.log'),
        datePattern: 'YYYY-MM-DD HH:mm:ss',
        level: 'info',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      }),
      new DailyRotateFile({
        filename: join(LOG_DIR, 'debug', 'debug-%DATE%.log'),
        datePattern: 'YYYY-MM-DD HH:mm:ss',
        level: 'debug',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      }),
      new DailyRotateFile({
        filename: join(LOG_DIR, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD HH:mm:ss',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      }),
    ];

    this.logger = createLogger({
      level: this._level,
      // 设置日志格式
      format: format.combine(
        // timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        timestamp({
          format: () => {
            const now = new Date();
            return `${now.toISOString()},${now.getUTCMilliseconds()}Z`;
          }
        }),
        // metadata(),
        logFormat,
      ),
      // 设置默认的传输方式
      transports: transportList,
      exceptionHandlers: [
        new DailyRotateFile({
          filename: join(LOG_DIR, 'exceptions-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });

    if (this._env !== 'prod') {
      this.logger.add(
        new transports.Console({
          format: combine(
            // process.env.NODE_ENV === 'dev' ? colorize() : format.uncolorize(),
            logFormat
          )
        })
      );
    }
  }

  /**
   * 记录日志
   * @param level 日志级别
   * @param message 日志内容
   * @param context 日志上下文
   */
  public log(level: string, message: string, context?: Record<string, any>): void {
    this.logger.log({
      level,
      message,
      ...(context || {})
    });
  }

  /**
   * Error 日志
   * @param message 
   * @param context 
   */
  public error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  /**
   * Warn 日志
   * @param message 
   * @param context 
   */
  public warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Info 日志
   * @param message 
   * @param context 
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Verbose 日志
   * @param message 
   * @param context 
   */
  public verbose(message: string, context?: Record<string, any>): void {
    this.log('verbose', message, context);
  }

  /**
   * Debug 日志
   * @param message 
   * @param context 
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }
}
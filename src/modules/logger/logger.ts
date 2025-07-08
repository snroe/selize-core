import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import DailyRotateFile from 'winston-daily-rotate-file';

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
    } catch (e) {
      metaStr = ' [Connot stringify metadata]';
    }
  }
  return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
});

interface LoggerConfig {
  env?: string;
}

export class Logger {
  private logger;
  private readonly _env: 'dev' | 'prod' | 'test';
  private readonly _level: string = 'debug';

  constructor(config?: LoggerConfig) {
    const { env = process.env.LOG_LEVEL || 'dev' } = config || {};

    // 强制类型转换确保符合联合类型
    this._env = env as 'dev' | 'prod' | 'test';

    const transportList = [
      new DailyRotateFile({
        filename: join(LOG_DIR, 'error', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      }),
      new DailyRotateFile({
        filename: join(LOG_DIR, 'warn', 'warn-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'warn',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      }),
      new DailyRotateFile({
        filename: join(LOG_DIR, 'info', 'info-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'info',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      }),
      new DailyRotateFile({
        filename: join(LOG_DIR, 'debug', 'debug-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'debug',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      }),
      new DailyRotateFile({
        filename: join(LOG_DIR, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
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

  public log(level: string, message: string, context?: Record<string, any>): void {
    this.logger.log({
      level,
      message,
      // ...(context && { metadata: context })
      ...(context || {})
    });
  }

  public error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  public verbose(message: string, context?: Record<string, any>): void {
    this.log('verbose', message, context);
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }
}
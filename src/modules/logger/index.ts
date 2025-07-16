import { ILogger, LoggerConfig } from "./logger.interface";
import { Logger } from "./logger";

const globalLogger: {
  instance: ILogger | null;
  config: LoggerConfig;
} = {
  instance: null,
  config: {
    level: 'debug',
    env: 'development'
  },
};

export const setLogger = (logger: ILogger): void => {
  globalLogger.instance = logger;
}

export const getLogger = (): ILogger => {
  if (!globalLogger.instance) {
    globalLogger.instance = new Logger(globalLogger.config);
  }

  return globalLogger.instance;
}

export const initLogger = (config: LoggerConfig): void => {
  globalLogger.config = { ...globalLogger.config, ...config };

  if (globalLogger.instance) {
    globalLogger.instance = new Logger(globalLogger.config);
  }
}

export * from './logger';
export * from './logger.interface';
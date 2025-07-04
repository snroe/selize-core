import { LogLevel, LEVEL } from "./levels.js";
import { snetWriteStream } from "./stream.js";
import fs from "fs-extra";
import path from "path";

const getTimeStamp = (): string => new Date().toISOString();

interface ConsoleOptions {
  path: string;
  message: string;
  encoding: BufferEncoding;
  level: LEVEL
}

/**
 * 日志系统配置与方法集合。
 *
 * 支持多种日志级别（OFF/INFO/ERROR/WARN/DEBUG/TRACE），并提供动态设置日志级别的能力。
 * 日志输出受 `currentLevel` 控制，低于该级别的日志不会被记录。
 * @example
 * ```ts
 * snetLog.setLevel('WARN');
 * snetLog.info('这是一条信息'); // 不输出
 * snetLog.warn('这是一个警告'); // 输出
 * ```
 */
export class Console {
  private level: string;
  private message: string;

  constructor(level: string, message: string) {
    this.level = level;
    this.message = message;
  }

  /**
 * 日志输出
 * @param {LEVEL} level 日志级别
 * @param {string} message 日志内容
 * @returns 
 */
  log(level: string, message: string): void {
    const timestamp = getTimeStamp();
    const formattedMessage = `${timestamp} [${level}]: ${message}\n`;

    switch (level) {
      case 'INFO':
        console.info(formattedMessage);
        break;
      case 'DEBUG':
        console.debug(formattedMessage);
        break;
      case 'ERROR':
        console.error(formattedMessage);
        break;
      case 'WARN':
        console.warn(formattedMessage);
        break;
      case 'TRACE':
        console.trace(formattedMessage);
        break;
      case 'OFF':
        break;
    }
  }

  /**
 * 不输出日志，但是会将日志写入日志文件
 * @param {string} message 日志内容
 */
  off(message: string): void { };

  /**
   * 输出 INFO 级别日志。
   * @param {string} message - 要输出的日志内容
   */
  info(message: string): void {
    this.log('INFO', message);
  };

  /**
   * 输出 DEBUG 级别日志。
   * @param {string} message - 要输出的日志内容
   */
  debug(message: string): void {
    this.log('DEBUG', message);
  };

  /**
   * 输出 ERROR 级别日志。
   * @param {string} message - 要输出的日志内容
   */
  error(message: string): void {
    this.log('ERROR', message);
  };

  /**
   * 输出 WARN 级别日志。
   * @param {string} message - 要输出的日志内容
   */
  warn(message: string): void {
    this.log('WARN', message);
  };

  /**
   * 输出 TRACE 级别日志。
   * @param {string} message - 要输出的日志内容
   */
  trace(message: string): void {
    this.log('TRACE', message);
  }
}

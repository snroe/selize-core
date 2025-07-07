import fs from 'fs-extra';
import path from 'path';
import { format, Format } from './format.js';
import { LogLevel, LEVEL } from "./levels.js"

interface LoggerOptions {
  level?: LEVEL;             // 当前日志级别
  filePath?: string;            // 日志文件路径
  encoding?: BufferEncoding;    // 编码格式
  writeToFile?: boolean;        // 是否写入文件
  message?: string;
  format?: string;  // 格式化函数
}

export class Logger {
  private readonly timestamp: Date;
  private readonly streamCache: { [key: string]: fs.WriteStream } = {};
  private level: LEVEL;
  private filePath: string;
  private encoding: BufferEncoding;
  private format: string;
  private message: string;
  private writeToFile: boolean;

  constructor(options: LoggerOptions = {}) {
    this.timestamp = new Date();
    this.level = options.level || LogLevel.INFO;
    this.filePath = path.resolve(options.filePath || './app.log');
    this.encoding = options.encoding || 'utf8';
    this.writeToFile = options.writeToFile ?? true; // 默认写入文件
    this.message = options.message || '';
    this.format = options.format || this.json();
  }

  json(): string {
    return JSON.stringify(this.toJsonObject());
  }

  private toJsonObject(): { timestamp: string; level: string; message: string } {
    return {
      timestamp: this.timestamp.toISOString(),
      level: typeof this.level === 'string' ? this.level : 'unknown',
      message: typeof this.message === 'string' ? this.message : String(this.message),
    };
  }
  string(): string {
    return this.toString();
  }

  private toString(): string {
    return `${this.timestamp.toISOString()} [${this.level}] ${this.message}\n`
  }

  // 获取或创建写入流
  private getOrCreateWriteStream(filePath: string): fs.WriteStream {
    if (!this.streamCache[filePath]) {
      this.streamCache[filePath] = fs.createWriteStream(filePath, { flags: 'a', encoding: this.encoding });
    }
    return this.streamCache[filePath];
  }

  // 记录信息
  private log(level: LEVEL, message: string): Promise<void> {
    const formattedMessage = this.json();
    // 如果不写入文件，直接 resolve
    if (!this.writeToFile) {
      return Promise.resolve();
    }

    // 写入日志级别低于设定级别时，不记录
    if (LogLevel[level] < LogLevel[this.level]) {
      return Promise.resolve();
    }

    // 写入文件
    const writeStream = this.getOrCreateWriteStream(this.filePath);
    return new Promise((resolve, reject) => {
      writeStream.write(formattedMessage, this.encoding, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  // 提供不同级别的日志方法
  info(message: string): Promise<void> {
    return this.log(LogLevel.INFO, message);
  }

  warn(message: string): Promise<void> {
    return this.log(LogLevel.WARN, message);
  }

  error(message: string): Promise<void> {
    return this.log(LogLevel.ERROR, message);
  }

  // 清理所有打开的写入流
  cleanup(): void {
    Object.values(this.streamCache).forEach(ws => ws.end());
  }
}
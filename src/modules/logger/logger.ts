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

// class Logger {
//   private readonly timestamp: Date;
//   private readonly streamCache: { [key: string]: fs.WriteStream } = {};
//   private level: LEVEL;
//   private filePath: string;
//   private encoding: BufferEncoding;
//   private format: string;
//   private message: string;
//   private writeToFile: boolean;

//   constructor(options: LoggerOptions = {}) {
//     this.timestamp = new Date();
//     this.level = options.level || LogLevel.INFO;
//     this.filePath = path.resolve(options.filePath || './app.log');
//     this.encoding = options.encoding || 'utf8';
//     this.writeToFile = options.writeToFile ?? true; // 默认写入文件
//     this.message = options.message || '';
//     this.format = options.format || this.json();
//   }

//   json(): string {
//     return JSON.stringify(this.toJsonObject());
//   }

//   private toJsonObject(): { timestamp: string; level: string; message: string } {
//     return {
//       timestamp: this.timestamp.toISOString(),
//       level: typeof this.level === 'string' ? this.level : 'unknown',
//       message: typeof this.message === 'string' ? this.message : String(this.message),
//     };
//   }
//   string(): string {
//     return this.toString();
//   }

//   private toString(): string {
//     return `${this.timestamp.toISOString()} [${this.level}] ${this.message}\n`
//   }

//   // 获取或创建写入流
//   private getOrCreateWriteStream(filePath: string): fs.WriteStream {
//     if (!this.streamCache[filePath]) {
//       this.streamCache[filePath] = fs.createWriteStream(filePath, { flags: 'a', encoding: this.encoding });
//     }
//     return this.streamCache[filePath];
//   }

//   // 记录信息
//   private log(level: LEVEL, message: string): Promise<void> {
//     const formattedMessage = this.json();
//     // 如果不写入文件，直接 resolve
//     if (!this.writeToFile) {
//       return Promise.resolve();
//     }

//     // 写入日志级别低于设定级别时，不记录
//     if (LogLevel[level] < LogLevel[this.level]) {
//       return Promise.resolve();
//     }

//     // 写入文件
//     const writeStream = this.getOrCreateWriteStream(this.filePath);
//     return new Promise((resolve, reject) => {
//       writeStream.write(formattedMessage, this.encoding, (err) => {
//         if (err) return reject(err);
//         resolve();
//       });
//     });
//   }

//   // 提供不同级别的日志方法
//   info(message: string): Promise<void> {
//     return this.log(LogLevel.INFO, message);
//   }

//   warn(message: string): Promise<void> {
//     return this.log(LogLevel.WARN, message);
//   }

//   error(message: string): Promise<void> {
//     return this.log(LogLevel.ERROR, message);
//   }

//   // 清理所有打开的写入流
//   cleanup(): void {
//     Object.values(this.streamCache).forEach(ws => ws.end());
//   }
// }

// // 使用示例
// const logger = new Logger({
//   level: LogLevel.INFO,
//   filePath: './mylog.log',
//   format: 'string'
// });

// logger.info('这是一条信息').then(() => console.log('Info logged'));
// logger.warn('这是一个警告').then(() => console.log('Warn logged'));
// logger.error('这是一个错误').then(() => console.log('Error logged'));

// // 程序结束时记得清理资源
// process.on('exit', () => logger.cleanup());


const timestamp: Date = new Date();
const streamCache: { [key: string]: fs.WriteStream } = {};
const level: LEVEL = LogLevel.INFO;
const filePath: string = './app.log';
const encoding: BufferEncoding = 'utf8';
// const format: Format = 'json';
const message: string = '';
const writeToFile: boolean = false;

// const options = {
//   timestamp,
//   streamCache,
//   level,
//   filePath,
//   encoding,
//   format,
//   message,
//   writeToFile,
// }

export const logger = (options: LoggerOptions) => {
  const {
    // timestamp,
    // streamCache,
    level,
    filePath = './app.log',
    encoding = 'utf8',
    // format,
    message,
    writeToFile,
  } = options;
  const timestamp: Date = new Date();
  const streamCache: { [key: string]: fs.WriteStream } = {};

  // 获取或创建写入流
  const getOrCreateWriteStream = (filePath: string): fs.WriteStream => {
    if (!streamCache[filePath]) {
      streamCache[filePath] = fs.createWriteStream(filePath, { flags: 'a', encoding: encoding });
    }
    return streamCache[filePath];
  }

  // 记录信息
  const log = (level: LEVEL, message: string): Promise<void> => {
    const formattedMessage = format().json(level, message);
    // 如果不写入文件，直接 resolve
    if (!writeToFile) {
      return Promise.resolve();
    }

    // 写入日志级别低于设定级别时，不记录
    if (LogLevel[level] < LogLevel[level]) {
      return Promise.resolve();
    }

    // 写入文件
    const writeStream = getOrCreateWriteStream(filePath);
    return new Promise((resolve, reject) => {
      writeStream.write(formattedMessage, encoding, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  // 清理所有打开的写入流
  const cleanup = (): void => {
    Object.values(streamCache).forEach(ws => ws.end());
  }

  return {
    // info: (message: string): Promise<void> => log(LogLevel.INFO, message),
    // warn: (message: string): Promise<void> => log(LogLevel.WARN, message),
    // error: (message: string): Promise<void> => log(LogLevel.ERROR, message),
    cleanup: cleanup as () => void,
  }
}
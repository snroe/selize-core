import path from 'path';
import fs from 'fs-extra';
import { LogLevel } from './levels.js';
import type { LEVEL } from './levels.js';

const rootPath = process.cwd();
const time = new Date().toISOString()

const defaultOptions = {
  path: path.join(rootPath, 'logs'),
  logFile: path.join(rootPath, 'logs', `${time}.log`),
  logLevel: process.env.LOG_LEVEL || 'info',
  logMaxSize: process.env.LOG_MAX_SIZE || 1048576,
  logMaxFiles: process.env.LOG_MAX_FILES || 5,
  logCompress: process.env.LOG_COMPRESS || true,
}

export interface Options {
  path: string;
  message: string;
  encoding: BufferEncoding;
  level: LEVEL
}

const streamCache: { [key: string]: fs.WriteStream } = {};

export const getOrCreateWriteStream = (path: string, encoding: BufferEncoding = 'utf8'): fs.WriteStream => {
  if (!streamCache[path]) {
    streamCache[path] = fs.createWriteStream(path, { encoding, flags: 'a' });
  }
  return streamCache[path];
};

/**
 * 创建日志写入流
 * @param {Options} options - 日志配置项
 * @param {fs.PathLike} [options.path=defaultsoptions.logFile] - 日志文件保存路径
 * @param {string} options.message - 日志内容
 * @param {BufferEncoding} [options.encoding] - 日志文件名称
 * @param {LEVEL} options.level - 日志级别
 * @returns {Promise<void>}
 */
export const snetWriteStream = (options: Options): Promise<void> => {
  const { path = defaultOptions.logFile, message, encoding = 'utf8', level = LogLevel.INFO } = options;

  if (!message || !level) {
    return Promise.reject(new Error('Missing required parameters: message or level'));
  }

  const writeStream = getOrCreateWriteStream(path, encoding);

  return new Promise((resolve, reject) => {
    const handleError = (err: Error) => {
      writeStream.off('finish', handleFinish);
      reject(err);
    };

    const handleFinish = () => {
      writeStream.off('error', handleError);
      resolve();
    };

    writeStream.on('error', handleError);
    writeStream.on('finish', handleFinish);

    // 写入数据，并结束流
    writeStream.write(message, (err) => {
      if (err) return reject(err);
      writeStream.end();
    });
  });
};

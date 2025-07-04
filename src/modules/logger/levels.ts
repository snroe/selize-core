import { deepFreeze } from "@selize/utils"

export type LEVEL = Readonly<'OFF' | 'INFO' | 'ERROR' | 'WARN' | 'DEBUG' | 'TRACE'>

/**
 * 日志级别映射表。
 */
const LogLevelMap = {
  OFF: 'OFF',
  INFO: 'INFO',
  ERROR: 'ERROR',
  WARN: 'WARN',
  DEBUG: 'DEBUG',
  TRACE: 'TRACE',
} as const;

/**
 * @type {Readonly<typeof LogLevelmap>} 
 * @description 日志级别
 * - OFF: 不在控制台输出日志，但是会将日志写入文件
 * - INFO: 普通信息日志
 * - DEBUG: 调试信息日志
 * - ERROR: 错误日志
 * - WARN: 警告日志
 * - TRACE: 更细粒度的调试信息
 *@example
 *   ```ts
 *   LogLevel.INFO // 'INFO'
 *   LogLevel.ERROR // 'ERROR'
 *   ```
 */
export const LogLevel: Readonly<typeof LogLevelMap> = deepFreeze(LogLevelMap);

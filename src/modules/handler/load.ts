import fs from 'fs-extra';
import type e from 'express';

type Handler = (req: e.Request, res: e.Response, next: e.NextFunction) => void;

// 缓存模块导出的 handler，避免重复解析
const handlerCache = new Map<string, Handler>();

/**
 * 动态加载路由处理函数（支持 file:// 协议格式的模块路径）
 * @param moduleUrl 模块文件的 file:// URL
 * @returns Express 中间件处理函数
 */
export const selizeLoadHandler = async (moduleUrl: string): Promise<Handler> => {
  // 先检查缓存中是否存在
  if (handlerCache.has(moduleUrl)) {
    return handlerCache.get(moduleUrl)!;
  }

  try {
    // 验证是否是 file:// 协议开头
    const url = new URL(moduleUrl);
    if (url.protocol !== 'file:') {
      throw new Error(`Unsupported protocol type：${url.protocol}（only supports file:// )`);
    }

    // 动态导入模块
    const moduleExports = await import(moduleUrl);

    // 提取 default 或 handler 导出项
    let exportedHandler = moduleExports.default || moduleExports.handler;

    // 如果 default 是对象，尝试取 .handler 属性
    if (exportedHandler && typeof exportedHandler !== 'function' && 'handler' in exportedHandler) {
      exportedHandler = exportedHandler.handler;
    }

    if (typeof exportedHandler === 'function') {
      handlerCache.set(moduleUrl, exportedHandler);
      return exportedHandler;
    } else {
      console.warn(`${moduleUrl} no valid processing function exported (missing default or handler)`);
      const errorHanlder: Handler = (req, res, next) => {
        res.status(501).send('The routing handling logic has not been implemented.');
      };

      handlerCache.set(moduleUrl, errorHanlder);
      return errorHanlder;
    }
  } catch (error) {
    console.error(`Failed to load route handler function：${moduleUrl}`, error);
    const errorHandler: Handler = (req, res, next) => {
      res.status(500).send('Internal server error: Route handler loading failed');
    };

    handlerCache.set(moduleUrl, errorHandler);

    return errorHandler;
  }
};
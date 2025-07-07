import fs from 'fs-extra';
import type e from 'express';

type Handler = (req: e.Request, res: e.Response, next: e.NextFunction) => void;

/**
 * 动态加载路由处理函数（支持 file:// 协议格式的模块路径）
 * @param moduleUrl 模块文件的 file:// URL
 * @returns Express 中间件处理函数
 */
export const selizeLoadHandler = async (moduleUrl: string): Promise<Handler> => {
  try {
    // 验证是否是 file:// 协议开头
    const url = new URL(moduleUrl);
    if (url.protocol !== 'file:') {
      throw new Error(`不支持的协议类型：${url.protocol}（仅支持 file:// )`);
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
      return exportedHandler;
    } else {
      console.warn(`${moduleUrl} 没有导出有效的处理函数 (缺少 default 或 handler)`);
      return (req, res, next) => {
        res.status(501).send('未实现该路由处理逻辑');
      };
    }
  } catch (error) {
    console.error(`加载路由处理函数失败：${moduleUrl}`, error);
    return (req, res, next) => {
      res.status(500).send('内部服务器错误：路由处理函数加载失败');
    };
  }
};
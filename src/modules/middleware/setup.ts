import type e from 'express';
import { ExpressApp } from '../../app.js';
import { defaultMiddleware } from './default.js';

/**
 * 设置和注册Express中间件
 * @param {e.RequestHandler[]} middlewares 需要注册的中间件数组
 * @returns 无返回值
 */
export const selizeSetupMiddlewares = async (middlewares: e.RequestHandler[]): Promise<void> => {
  // 注册默认中间件
  defaultMiddleware.forEach(middleware => {
    ExpressApp.use(middleware);
  });

  // 注册自定义中间件
  middlewares.forEach((middleware) => {
    ExpressApp.use(middleware);
  });
};
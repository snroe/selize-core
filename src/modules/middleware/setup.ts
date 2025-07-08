import type e from 'express';
import { ExpressApp } from '../../app.js';
import { requestLogger } from './requestLogger.js';

import cors from 'cors';
import bodyParser from 'body-parser';

/**
 * 设置和注册Express中间件
 * @param {e.RequestHandler[]} middlewares 需要注册的中间件数组
 * @returns 无返回值
 */
export const selizeSetupMiddlewares = async (middlewares: e.RequestHandler[]): Promise<void> => {
  ExpressApp.use(requestLogger);
  ExpressApp.use(cors());
  ExpressApp.use(bodyParser.json());

  // 注册自定义中间件
  middlewares.forEach((middleware) => {
    ExpressApp.use(middleware);
  });
};
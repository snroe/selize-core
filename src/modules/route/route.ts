import { ExpressApp } from '../../app.js';
import express from 'express';
import type e from 'express';
// import { selizeLoadRouter } from './load.js';
import { selizeCreateRouter } from './create.js';
import { selizeLoadHandler } from '../handler/load.js';

const router = express.Router();
const app = ExpressApp;

/**
 * 初始化并注册所有路由
 */
export const selizeRoute = async (): Promise<void> => {
  // const routes = await selizeLoadRouter();
  const routes = await selizeCreateRouter();

  routes.forEach(route => {
    const { method, url, handlerModule } = route;
    const handler = async (req: e.Request, res: e.Response, next: e.NextFunction) => {
      try {
        const handler = await selizeLoadHandler(handlerModule);
        handler(req, res, next);
      } catch (error) {
        console.error(`Handler error: ${method} ${url}\n`, "Erroe message:", error);
      }
    }

    (app as any)[method.toLowerCase()](url, handler);
  })
};
import { ExpressApp } from '../../app.js';
import type e from 'express';
import path from 'path';
import { selizeCreateRouter } from './create.js';
import { selizeLoadHandler } from '../handler/load.js';

const app = ExpressApp;

/**
 * 初始化并注册所有路由
 */
export const selizeRoute = async (config?: { routesDir?: string }): Promise<void> => {
  const routesDir = config?.routesDir || path.join(process.cwd(), 'src', 'routes')
  const routes = await selizeCreateRouter({ routesDir });

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
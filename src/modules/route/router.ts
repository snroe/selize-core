import fs from 'fs-extra';
import { ExpressApp } from '../../app.js';
import express from 'express';
import { HttpStatusCode, type HttpStatusCodeValue } from '../http/code.js';
import { HttpRequestMethod, type HttpRequestMethodValue } from '../http/method.js';
import type e from 'express';

const router = express.Router();
const app = ExpressApp;

/**
 * 用于注册路由
 * @param {object} routes
 * @param {string} routes.url
 * @param {HttpRequestMethodValue} routes.method
 */
export function selizeRouter(routes: Array<{ method: HttpRequestMethodValue; url: string; handler: (req: e.Request, res: e.Response, next: e.NextFunction) => void }>): void {
  routes.forEach(route => {
    const { method, url, handler } = route;
    // 将method转换为小写后调用路由方法
    (router as any)[method.toLowerCase()](url, handler);
  });
  app.use(router);
  // fs.writeJSONSync(`${process.cwd()}/.selize/selize.routes.json`, routes);
}
import fs from 'fs-extra';
import { ExpressApp } from '../../app.js';
import express from 'express';
import { HttpStatusCode, type HttpStatusCodeValue } from '../http/code.js';
import { HttpRequestMethod, type HttpRequestMethodValue } from '../http/method.js';
import type e from 'express';
import { selizeLoadRouter, onRoutesReloaded } from './load.js';
import { selizeLoadHandler } from 'src/main.js';

const router = express.Router();
const app = ExpressApp;

// 存储当前注册的所有路由
let currentRoutes: Array<{ method: HttpRequestMethodValue; url: string }> = [];

/**
 * 注册或刷新路由表
 */
const registerRoutes = async (): Promise<void> => {
  const routes = await selizeLoadRouter();

  // 移除旧路由（通过中间件方式）
  removeCurrentRoutes();

  for (const route of routes) {
    const { method, url, handlerModule } = route;

    try {
      const handler = await selizeLoadHandler(handlerModule);
      (ExpressApp as any)[method.toLowerCase()](url, handler);

      // 记录当前注册的路由
      currentRoutes.push({ method, url });
    } catch (err) {
      console.error(`注册路由失败: ${method} ${url}`, err);
      ExpressApp.use(url, (req, res) => {
        res.status(500).json({ code: 500, message: 'Internal Server Error' });
      });
    }
  }

  console.log(`✅ 已注册 ${routes.length} 个路由`);
};

/**
 * 移除当前所有已注册的路由
 */
const removeCurrentRoutes = (): void => {
  if (currentRoutes.length === 0) return;

  currentRoutes.forEach(({ method, url }) => {
    (ExpressApp as any)[method.toLowerCase()](url, (req: e.Request, res: e.Response, next: e.NextFunction) => {
      next(); // 移除旧 handler
    });
  });

  currentRoutes = [];
};

/**
 * 初始化并注册所有路由
 */
export const selizeRoute = async (): Promise<void> => {
  await registerRoutes();

  // 监听热更新
  onRoutesReloaded(async () => {
    console.log('路由配置已更新，正在重新注册...');
    await registerRoutes();
  });
};
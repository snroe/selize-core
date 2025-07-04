import { ExpressApp } from "./app.js";
import { selizeRouter, selizeSetupMiddlewares } from './modules/index.js'
import type { HttpRequestMethodValue } from "./modules/index.js";

import type e from "express";

interface SelizeServerOptions {
  port?: string;
  env?: 'dev' | 'prod' | 'test';
}

type RouteConfig = {
  method: HttpRequestMethodValue;
  url: string;
  handler: (req: e.Request, res: e.Response, next: e.NextFunction) => void;
};

/**
 * SelizeServer 类
 * @example
 * ```ts
 * const server = new SelizeServer();
 * server.start();
 * ```
 */
export class SelizeServer {
  private static _instance: SelizeServer;

  private readonly _app: e.Express;
  private readonly _port: string;
  private readonly _env: 'dev' | 'prod' | 'test';
  private _middlewares: e.RequestHandler[] = [];
  private _routes: RouteConfig[] = [];

  /**
   * 初始化实例
   * @param {object} [config] - 配置对象
   * @param {string} [config.port] - 服务端口，默认为环境变量PORT或3000
   * @param {string} [config.env] - 环境变量，默认为process.env.NODE_ENV或dev
   * @private
   */
  private constructor(config?: SelizeServerOptions) {
    if (SelizeServer._instance) {
      throw new Error('SelizeServer instance already exists! Use SelizeServer.getInstance() instead.');
    }

    const { port = process.env.PORT || '3000', env = (process.env.NODE_ENV as any) || 'dev' } = config || {};
    this._app = ExpressApp;
    this._port = port;
    this._env = env;
  }

  /**
   * 获取唯一实例的方法
   * @param config 配置对象
   * 
   * @returns {SelizeServer} SelizeServer 实例
   */
  public static getInstance(config: SelizeServerOptions): SelizeServer {
    if (!SelizeServer._instance) {
      new SelizeServer(config);
    }
    return SelizeServer._instance;
  }

  /**
   * 设置服务器端口
   */
  private setPort(): void {
    this._app.set('port', this._port);
  }

  /**
   * 获取 Express 实例
   * @returns express.Express
   */
  public getApp(): e.Express {
    return this._app;
  }

  /**
   * 启动服务器
   */
  public start(): void {
    if (!this._port) {
      throw new Error('Please set the PORT environment variable.');
    }

    this.setPort();

    const server = this._app.listen(this._port, () => {
      console.log(`App run on: http://localhost:${this._port}`);
    });

    // 监听错误事件
    server.on('error', (error: NodeJS.ErrnoException) => {
      const bind = typeof this._port === 'string' ? `pipe ${this._port}` : `port ${this._port}`;

      switch (error.code) {
        case 'EACCES':
          console.error(`${bind} requires elevated privileges`);
          process.exit(1);
        case 'EADDRINUSE':
          console.error(`${bind} is already in use`);
          process.exit(1);
        default:
          console.error(error);
          process.exit(1);
      }
    });
  }

  /**
   * 手动注册路由
   * @param routes 
   */
  public registerRoutes(routes: RouteConfig[]): void {
    const existingUrls = new Set(this._routes.map(route => route.url));
    const newUrls = new Set();

    // 防止自动注册的路由与手动注册的路由重复
    for (const route of routes) {
      if (existingUrls.has(route.url)) {
        console.warn(`Skipping duplicate route URL: ${route.url}`);
        continue;
      }
      newUrls.add(route.url);
    }

    this._routes.push(...routes);
    selizeRouter(routes);
  }

  /**
   * 添加中间件
   */
  public setupMiddlewares(...middlewares: e.RequestHandler[]): void {
    this._middlewares.push(...middlewares)
    selizeSetupMiddlewares(this._middlewares)
  }

  /**
   * 添加插件
   */
  public setupPlugins(plugin: any[]): void { }
}
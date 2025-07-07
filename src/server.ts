import { ExpressApp } from "./app.js";
import { selizeCreateRouter, selizeRoute, selizeSetupMiddlewares, selizeSetupDefaultMiddlewares } from './modules/index.js'
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
  private readonly _app: e.Express;
  private readonly _port: string;
  private readonly _env: 'dev' | 'prod' | 'test';
  private _middlewares: e.RequestHandler[] = [];
  private _server?: e.Application["listen"] extends () => infer T ? T : any;

  /**
   * 初始化实例
   * @param {object} [config] - 配置对象
   * @param {string} [config.port] - 服务端口，默认为环境变量PORT或3000
   * @param {string} [config.env] - 环境变量，默认为process.env.NODE_ENV或dev
   * @private
   */
  public constructor(config?: SelizeServerOptions) {
    const { port = process.env.PORT || '3000', env = (process.env.NODE_ENV as any) || 'dev' } = config || {};
    this._app = ExpressApp;
    this._port = port;
    this._env = env;

    this.initDefaultMiddlewares();
    this.registerRoutes();
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
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
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
    });
  }

  /**
   * 关闭服务器（测试环境）
   */
  public close(): void {
    if (!this._server) {
      throw new Error('Cannot close server: it was never started.');
    }

    this._server.close((err) => {
      if (err) {
        console.error('Error closing server:', err);
        process.exit(1);
      } else {
        console.log('Server closed successfully');
      }
    });
  }

  /**
   * 手动注册路由
   * @param routes 
   */
  public async registerRoutes(): Promise<void> {
    try {
      await selizeRoute();
    } catch (error) {
      console.error('Error registering routes:', error);
      process.exit(1);
    }
  }

  /**
   * 初始化默认中间件
   */
  private async initDefaultMiddlewares(): Promise<void> {
    try {
      await selizeSetupDefaultMiddlewares();
    } catch (error) {
      console.error('Failed to initialize default middlewares:', error);
      throw error;
    }
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
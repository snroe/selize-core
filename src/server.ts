import { ExpressApp } from "./app.js";
import { selizeRoute, selizeSetupMiddlewares } from './modules/index.js'
import path from 'path';
import { logger } from "./modules/index.js";
import type e from "express";
import type { RouteEntry } from './modules/index.js';

interface SelizeServerOptions {
  port?: string;
  env?: 'dev' | 'prod' | 'test';
  routesDir?: string;
}

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
  private _routesDir: string = '';
  private _routes: RouteEntry[] = [];
  private _middlewares: e.RequestHandler[] = [];
  private _server?: e.Application["listen"] extends () => infer T ? T : any;

  /**
   * 初始化实例
   * @param {object} [config] 配置对象
   * @param {string} [config.port] 服务端口，默认为环境变量PORT或3000
   * @param {string} [config.env] 环境变量，默认为process.env.NODE_ENV或dev
   * @private
   */
  public constructor(config?: SelizeServerOptions) {
    const { port = process.env.PORT || '3000', env = (process.env.NODE_ENV as any) || 'dev', routesDir = path.join(process.cwd(), 'src', 'routes') } = config || {};
    this._app = ExpressApp;
    this._port = port;
    this._env = env;
    this._routesDir = routesDir;
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

  private async init(): Promise<void> {
    await this.setupMiddlewares();
    await this.registerRoutes({ routesDir: this._routesDir });
  }

  /**
   * 启动服务器
   */
  public async start(): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this._port) {
        throw new Error('Please set the PORT environment variable.');
      }

      this.setPort();

      const server = this._app.listen(this._port, () => {
        logger.info(`Server run on: http://localhost:${this._port}`);
        resolve();
      });

      // 监听错误事件
      server.on('error', (error: NodeJS.ErrnoException) => {
        const bind = typeof this._port === 'string' ? `pipe ${this._port}` : `port ${this._port}`;

        switch (error.code) {
          case 'EACCES':
            logger.error(`${bind} requires elevated privileges`);
            process.exit(1);
          case 'EADDRINUSE':
            logger.error(`${bind} is already in use`);
            process.exit(1);
          default:
            logger.error(error as unknown as string);
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

    this._server.close((error) => {
      if (error) {
        logger.error('Error closing server:', error);
        process.exit(1);
      } else {
        logger.info('Server closed successfully');
      }
    });
  }

  /**
   * 手动注册路由
   * @param rootesDir 路由目录 
   */
  public async registerRoutes(config: { routesDir?: string }): Promise<void> {
    try {
      const routesDir = config?.routesDir || this._routesDir;

      this._routes = await selizeRoute({ routesDir });
    } catch (error: NodeJS.ErrnoException | any) {
      logger.error('Error registering routes:', error);
      process.exit(1);
    }
  }

  /**
   * 获取路由列表
   * @returns 路由列表
   */
  public getRoutes(): RouteEntry[] {
    return this._routes;
  }

  /**
   * 添加中间件
   */
  public async setupMiddlewares(...middlewares: e.RequestHandler[]): Promise<void> {
    this._middlewares.push(...middlewares)
    await selizeSetupMiddlewares(this._middlewares)
  }

  /**
   * 添加插件
   */
  public setupPlugins(plugin: any[]): void { }
}
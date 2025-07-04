import fs from 'fs-extra';
import path from 'path';
import type e from 'express';
import { HttpRequestMethodValue } from 'src/main.js';
import { selizeRouter } from './router.js';

const rootDir = process.cwd();
const projectName = fs.readJSONSync(path.join(rootDir, 'package.json')).name;
const routesFilePath = path.join(rootDir, '.selize', `${projectName}.routes.json`);

/**
 * 加载并应用之前保存的路由配置
 */
export const selizeLoadRoute = async (): Promise<void> => {
  try {
    // 确保 .selize 目录存在
    await fs.ensureDir(path.dirname(routesFilePath));

    // 读取路由文件
    if (!(await fs.pathExists(routesFilePath))) {
      console.warn(`Route file does not exist: ${routesFilePath}`);
      return;
    }

    const routers = await fs.readJSON(routesFilePath);

    // 应用每个路由
    for (const router of routers) {
      selizeRouter(router);
    }
  } catch (error: Error | any) {
    throw new Error(`Error loading routes from ${routesFilePath}: ${error.message}`, { cause: error });
  }
};
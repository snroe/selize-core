import fs from 'fs-extra';
import path from 'path';
import { HttpRequestMethod, type HttpRequestMethodValue } from '../http/method.js';
import { selizeCreateRouter } from './create.js';
import { hashFile } from '@selize/utils';
import chokidar from 'chokidar';

interface RouteEntry {
  name: string;
  url: string;
  method: HttpRequestMethodValue;
  filePath: string;
  fileHash: string;
  handlerType: 'dynamic-import';
  handlerModule: string;
}

const isValidRouteEntry = (entry: any): boolean => {
  if (typeof entry !== 'object' || entry === null) return false;

  const method = String(entry.method || '').toUpperCase();
  const validMethods = new Set(Object.values(HttpRequestMethod).map(m => m.toUpperCase()));

  return (
    typeof entry.name === 'string' &&
    typeof entry.url === 'string' &&
    typeof entry.filePath === 'string' &&
    typeof entry.fileHash === 'string' &&
    entry.handlerType === 'dynamic-import' &&
    typeof entry.handlerModule === 'string' &&
    validMethods.has(method)
  );
};

const isRoutesValid = (routes: any[]): boolean => {
  return Array.isArray(routes) && routes.every(isValidRouteEntry);
};

const getAllSourceFiles = async (dir: string): Promise<string[]> => {
  const files = await fs.readdir(dir);
  const result: string[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = await fs.stat(fullPath);

    if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.js'))) {
      result.push(fullPath);
    } else if (stat.isDirectory()) {
      const subFiles = await getAllSourceFiles(fullPath);
      result.push(...subFiles);
    }
  }

  return result;
};

let currentRoutes: RouteEntry[] | null = null;
let isReloading = false;

// 用于通知外部监听者路由已更新
const reloadListeners: (() => void)[] = [];

export const onRoutesReloaded = (callback: () => void): void => {
  reloadListeners.push(callback);
};

const triggerReload = (): void => {
  reloadListeners.forEach(cb => cb());
};

/**
 * 加载路由配置，支持缓存和热更新
 */
export const selizeLoadRouter = async (): Promise<RouteEntry[]> => {
  const routesFilePath = path.join(process.cwd(), '.selize', 'routes.json');
  const routesDir = path.join(process.cwd(), 'src');

  try {
    // 如果已有缓存直接返回
    if (currentRoutes) {
      return currentRoutes;
    }

    if (await fs.pathExists(routesFilePath)) {
      const routes = await fs.readJSON(routesFilePath);

      if (isRoutesValid(routes)) {
        currentRoutes = routes;
        startWatcher(); // 启动监听器
        return routes;
      }
    }

    // 缓存不存在或无效，强制生成
    console.log('未找到有效路由缓存，正在生成...');
    await selizeCreateRouter({ forceRefresh: true });

    const routes = await fs.readJSON(routesFilePath);
    if (!isRoutesValid(routes)) {
      throw new Error('生成的路由文件仍不合法，请检查 selizeCreateRouter 实现');
    }

    currentRoutes = routes;
    startWatcher(); // 成功加载后启动监听器
    return routes;
  } catch (error) {
    console.error('加载或生成路由失败:', error);
    throw error;
  }
};

/**
 * 启动文件监听器
 */
const startWatcher = (): void => {
  const srcDir = path.join(process.cwd(), 'src');

  const watcher = chokidar.watch(`${srcDir}/**/*.+(ts|js)`, {
    ignored: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      '**/.cache/**',
      '**/.selize/**',
    ],
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', async (filePath) => {
    if (isReloading) return;

    console.log(`检测到文件变动: ${filePath}，正在重新加载路由...`);
    isReloading = true;

    try {
      const routes = await fs.readJSON(path.join(process.cwd(), '.selize', 'routes.json'));
      const sourceFiles = await getAllSourceFiles(srcDir);

      let needsRebuild = false;

      for (const route of routes) {
        const { filePath, fileHash } = route;
        const currentHash = await hashFile(filePath, "sha256");

        if (currentHash !== fileHash) {
          needsRebuild = true;
          break;
        }
      }

      if (needsRebuild) {
        await selizeCreateRouter({ forceRefresh: true });
        currentRoutes = await selizeLoadRouter(); // 重新加载
      }

      triggerReload(); // 通知监听者更新完成
    } catch (err) {
      console.error('热更新失败:', err);
    } finally {
      isReloading = false;
    }
  });
};
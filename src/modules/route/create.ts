import fs from 'fs-extra';
import path from 'path';
import fg from 'fast-glob';
import { hashFile } from '@selize/utils';
import { HttpRequestMethod, type HttpRequestMethodValue } from '../http/method.js';
import { pathToFileURL } from 'url';

// 正则表达式定义
const METHOD_REGEX = /^([^[\s]+)\.([a-z]+)$/i; // 匹配 baseName.method 格式
const SKIP_FILE_REGEX = /$$.*?(server|test).*?$$/i; // 匹配 [server], [test]

// 类型定义
interface RouteEntry {
  name: string;
  url: string;
  method: HttpRequestMethodValue;
  filePath: string;
  fileHash: string;
  handlerType: 'dynamic-import';
  handlerModule: string;
}

interface LoadRouterConfig {
  routePath?: string;
  forceRefresh?: boolean; // 是否强制刷新缓存
}

// 忽略的文件夹名
const ignoreFolders = new Set(['app', 'modules', 'utils', 'server', 'plugins']);

/**
 * 将字符串转为短横线格式（kebab-case）
 */
function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * 将路径片段中的 _xxx 转换为 :xxx
 */
function convertSegment(segment: string): string {
  if (segment.startsWith('_')) {
    return `:${segment.slice(1)}`;
  }
  return segment;
}

/**
 * 构建 URL 路径
 */
function buildUrlPath(moduleName: string, segments: string[], routeName: string): string {
  let moduleNameConverted = convertSegment(moduleName);

  // 如果模块名是 index，则不显示在 URL 中
  if (moduleNameConverted === 'index') {
    moduleNameConverted = '';
  }

  const convertedSegments = segments.map(convertSegment);
  const kebabRouteName = toKebabCase(routeName);

  // 过滤掉所有 index 片段（例如 src/index/user/index.get.ts → /user）
  const filteredSegments = convertedSegments.filter(seg => seg !== 'index');

  // 如果 routeName 是 index，则忽略它
  if (routeName === 'index') {
    // return `/${moduleNameConverted}${filteredSegments.length ? '/' + filteredSegments.join('/') : ''}`
    //   .replace(/\\/g, '/')
    //   .replace(/\/+/g, '/')
    //   .replace(/\/$/, '');
    return `/${moduleNameConverted}${filteredSegments.length ? '/' + filteredSegments.join('/') : ''}`
      .replace(/\\/g, '/')           // 统一斜杠
      .replace(/\/+/g, '/')          // 去除多余斜杠
      .replace(/^$/, '/')           // 空字符串替换为根路径 "/"
      .replace(/\/$/, '');          // 去除结尾斜杠
  }

  return `/${moduleNameConverted}/${convertedSegments.join('/')}/${kebabRouteName}`
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/');
}

/**
 * 创建单个路由条目
 */
async function createRouteEntry(
  filePath: string,
  moduleName: string,
  segments: string[],
  routeName: string,
  method: HttpRequestMethodValue
): Promise<RouteEntry | null> {
  try {
    const urlPath = buildUrlPath(moduleName, segments, routeName);
    const fileHash = await hashFile(filePath, 'sha256');
    const moduleUrl = pathToFileURL(filePath).href;

    return {
      name: toKebabCase(routeName),
      url: urlPath,
      method,
      filePath,
      fileHash,
      handlerType: 'dynamic-import',
      handlerModule: moduleUrl,
    };
  } catch (err) {
    console.error(`Failed to create route entry for ${filePath}:`, err);
    return null;
  }
}

/**
 * 解析文件名中的 HTTP 方法
 */
function parseHttpMethod(baseName: string): {
  methodName: HttpRequestMethodValue;
  routeName: string;
} {
  const match = METHOD_REGEX.exec(baseName);

  let methodName: HttpRequestMethodValue = 'GET';
  let routeName = baseName;

  if (match) {
    routeName = match[1];
    methodName = match[2].toLowerCase() as HttpRequestMethodValue;
  }

  // 验证方法是否合法
  if (!Object.values(HttpRequestMethod).includes(methodName.toUpperCase() as any)) {
    throw new Error(`未知的 HTTP 方法: ${methodName}`);
  }

  return { methodName, routeName };
}

/**
 * 主函数：创建路由表并写入 JSON 文件
 */
export async function selizeCreateRouter(config?: LoadRouterConfig): Promise<void> {
  const routeRoot = config?.routePath || path.join(process.cwd(), 'src');

  const entries = await fg(['*/**/*.{ts,js}'], {
    cwd: routeRoot,
    absolute: true,
    onlyFiles: true,
    deep: Infinity,
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      '**/.cache/**',
      '**/.selize/**',
      ...Array.from(ignoreFolders).map(f => `**/${f}/**`),
    ],
  });

  const routes: RouteEntry[] = [];

  for (const filePath of entries) {
    const parsed = path.parse(filePath);
    const baseName = parsed.name;

    // 跳过测试或服务端专用文件
    if (SKIP_FILE_REGEX.test(baseName)) continue;

    try {
      const { methodName, routeName } = parseHttpMethod(baseName);

      const relativeDir = path.relative(routeRoot, path.dirname(filePath));
      const segments = relativeDir.split(path.sep).filter(Boolean);

      const moduleName = segments[0]; // 第一级目录作为模块名
      const subSegments = segments.slice(1); // 剩下的是子路径

      const route = await createRouteEntry(filePath, moduleName, subSegments, routeName, methodName);
      if (route) {
        routes.push(route);
      }
    } catch (error) {
      console.warn(`Skipping invalid route in ${filePath}:`, error);
    }
  }

  // 写入缓存或输出 JSON
  const outputDir = path.join(process.cwd(), '.selize');
  const outputFile = path.join(outputDir, 'routes.json');

  try {
    await fs.ensureDir(outputDir);
    await fs.writeJSON(outputFile, routes, { spaces: 2 });
  } catch (error) {
    throw new Error(`Error writing routes to ${outputFile}: ${error}`, { cause: error });
  }
}
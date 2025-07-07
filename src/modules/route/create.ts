import path from 'path';
import fg from 'fast-glob';
import { hashFile } from '@selize/utils';
import { HttpRequestMethod, type HttpRequestMethodValue } from '../http/method.js';
import { pathToFileURL } from 'url';

const METHOD_REGEX = /^([^[\s]+)\.([a-z]+)$/i; 

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
  routesDir?: string;
  ignoreFolders?: string[];
}

/**
 * 将字符串转为短横线格式（kebab-case）
 * @param str 字符串
 * @returns 转换后的字符串
 */
function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * 将路径片段中的 _xxx 转换为 :xxx
 * @param segment 片段
 * @returns 转换后的片段
 */
function convertSegment(segment: string): string {
  if (segment.startsWith('_')) {
    return `:${segment.slice(1)}`;
  }
  return segment;
}

/**
 * 标准化 URL 路径
 * @param url 路径
 * @returns 标准化后的路径
 */
function normalizeUrl(url: string): string {
  return url
    .replace(/\\/g, '/') // 统一斜杠
    .replace(/\/+/g, '/') // 去除多余斜杠
    .replace(/^\/?$/, '/'); // 空路径或 "/" 返回根路径 "/"
}

/**
 * 构建 URL 路径
 * @param moduleName 模块名
 * @param segments 路径片段
 * @param routeName 路由名
 */
function buildUrlPath(moduleName: string, segments: string[], routeName: string): string {
  let moduleNameConverted = convertSegment(moduleName);

  // 如果模块名是 index，则不显示在 URL 中
  if (moduleNameConverted === 'index') {
    moduleNameConverted = '';
  }

  // 处理路径片段
  const convertedSegments = segments.map(convertSegment);

  // 过滤掉所有 index 片段
  const filteredSegments = convertedSegments.filter(seg => seg !== 'index');

  // 如果 routeName 是 index，则忽略它
  let url: string;
  if (routeName === 'index') {
    url = `/${moduleNameConverted}${filteredSegments.length ? '/' + filteredSegments.join('') : ''}`;
  } else {
    // 否则保留 routeName
    const kebabRouteName = toKebabCase(routeName);
    url = `/${moduleNameConverted}${filteredSegments.length ? '/' + filteredSegments.join('') : ''}/${kebabRouteName}`;
  }

  // 最终标准化 URL 并兜底处理空值
  return normalizeUrl(url);
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
  } catch (error) {
    console.error(`Failed to create route entry for ${filePath}:`, error);
    return null;
  }
}

/**
 * 解析文件名中的 HTTP 方法
 * @param baseName 文件名
 * @returns HTTP 方法和路由名
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
 * 创建路由表
 * @param config 配置项
 * @param config.routesDir 路由根目录
 * @param config.ignoreFolders 忽略的目录
 * @returns 路由表
 */
export async function selizeCreateRouter(config?: LoadRouterConfig): Promise<RouteEntry[]> {
  const routeRoot = config?.routesDir || path.join(process.cwd(), 'src', 'routes');
  const ignoreFolders = new Set(config?.ignoreFolders || []);

  const entries = await fg(['*/**/*.{ts,js}'], {
    cwd: routeRoot,
    absolute: true,
    onlyFiles: true,
    deep: Infinity,
    ignore: [
      ...Array.from(ignoreFolders).map(f => `**/${f}/**`),
    ],
  });

  const routes: RouteEntry[] = [];

  for (const filePath of entries) {
    const parsed = path.parse(filePath);
    const baseName = parsed.name;

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

  return routes;
}

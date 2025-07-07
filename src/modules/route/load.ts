// import fs from 'fs-extra';
// import path from 'path';
// import { HttpRequestMethod, type HttpRequestMethodValue } from '../http/method.js';
// import { selizeCreateRouter } from './create.js';
// import { hashFile } from '@selize/utils';

// interface RouteEntry {
//   name: string;
//   url: string;
//   method: HttpRequestMethodValue;
//   filePath: string;
//   fileHash: string;
//   handlerType: 'dynamic-import';
//   handlerModule: string;
// }

// const isValidRouteEntry = (entry: any): boolean => {
//   if (typeof entry !== 'object' || entry === null) return false;

//   const method = String(entry.method || '').toUpperCase();
//   const validMethods = new Set(Object.values(HttpRequestMethod).map(m => m.toUpperCase()));

//   return (
//     typeof entry.name === 'string' &&
//     typeof entry.url === 'string' &&
//     typeof entry.filePath === 'string' &&
//     typeof entry.fileHash === 'string' &&
//     entry.handlerType === 'dynamic-import' &&
//     typeof entry.handlerModule === 'string' &&
//     validMethods.has(method)
//   );
// };

// const isRoutesValid = (routes: any[]): boolean => {
//   return Array.isArray(routes) && routes.every(isValidRouteEntry);
// };

// let currentRoutes: RouteEntry[] | null = null;

// /**
//  * 加载路由配置，支持缓存和热更新
//  */
// export const selizeLoadRouter = async (): Promise<RouteEntry[]> => {
//   const routesFilePath = path.join(process.cwd(), '.selize', 'routes.json');
//   const routesDir = path.join(process.cwd(), 'src');

//   const routes = await selizeCreateRouter();

//   return routes;
// };
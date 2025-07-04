import { deepFreeze } from '@selize/utils';

let HttpRequestMethodMap = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
  TRACE: 'TRACE',
  CONNECT: 'CONNECT',
} as const

export type HttpRequestMethodValue = (typeof HttpRequestMethodMap)[keyof typeof HttpRequestMethodMap]
export type HttpRequestMethodKey = keyof typeof HttpRequestMethodMap

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
 */
export const HttpRequestMethod = deepFreeze(HttpRequestMethodMap) as Readonly<typeof HttpRequestMethodMap>

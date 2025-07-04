import { LEVEL } from "./levels.js"

export type Format = 'json' | 'string'

export const format = (): {
  json: (level: LEVEL, message: string) => string
  string: (level: LEVEL, message: string) => string
} => {
  const json = (level: LEVEL, message: string): string => {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
    })
  }

  const string = (level: LEVEL, message: string): string => {
    return `${new Date().toISOString()} [${level}] ${message}\n`
  }

  return {
    json,
    string,
  }
}

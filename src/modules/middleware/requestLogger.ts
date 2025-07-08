import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger/index.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const ignorePaths = ['/ping', '/test'];
  if (ignorePaths.some(path => req.originalUrl?.startsWith(path))) {
    return next();
  }

  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
    const responseTime = elapsedTimeInMs.toFixed(2);

    logger.info('HTTP request information', {
      'remote-addr': req.ip || req.ips,
      'http-version': req.httpVersion,
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      'response-time': `${responseTime}ms`,
      'user-agent': req.headers['user-agent'] || '-',
    });
  });

  next();
};
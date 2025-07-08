import cors from 'cors';
import bodyParser from 'body-parser';
import { requestLogger } from './requestLogger.js';

import type e from 'express';

export const defaultMiddleware: e.RequestHandler[] = [
  cors(),
  bodyParser.json(),
];

import type e from 'express';

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';

export const defaultMiddleware: e.RequestHandler[] = [
  cors(),
  bodyParser.json(),
  morgan(':method :url :status :res[content-length] - :response-time ms'),
];

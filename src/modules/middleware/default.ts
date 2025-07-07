import type e from 'express';

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';

export const defaultMiddleware: e.RequestHandler[] = [
  cors(),
  bodyParser.json(),
  morgan(function (tokens, req, res) {
    return [
      'time:', tokens.date(req, res, 'iso'),
      'remote-addr:', tokens['remote-addr'](req, res),
      'HTTP/', tokens['http-version'](req, res),
      'method:', tokens.method(req, res),
      'url:', tokens.url(req, res),
      'status:', tokens.status(req, res),
      'response-time:', tokens['response-time'](req, res), 'ms'
    ].join(' ')
  })
];

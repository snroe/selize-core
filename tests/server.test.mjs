import { SelizeServer } from '../lib/main.js'

const routes = [
  {
    method: 'get',
    url: '/',
    handler: (req, res) => {
      res.send('Hello World!');
    }
  },
  {
    method: 'get',
    url: '/about',
    handler: (req, res) => {
      res.send('About Page');
    }
  },
  {
    method: 'post',
    url: '/submit',
    handler: (req, res) => {
      res.send('Form submitted!');
    }
  }
];

const port = 3000;
const server = new SelizeServer({ port })
server.registerRoutes(routes)

// server.setupMiddlewares([loggerMiddleware])
server.start()

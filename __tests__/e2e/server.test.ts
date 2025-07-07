import { SelizeServer } from '../../src/main.ts';

export let server: SelizeServer;

try {
  server = new SelizeServer();
  await server.start();

  const routes = server.getRoutes();
} catch (err) {
  console.error('Failed to start server:', err);
}
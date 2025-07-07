import { SelizeServer } from '../src/main.ts';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, test } from "bun:test";

export let server: SelizeServer;

beforeAll(async () => {
  try {
    server = new SelizeServer();
    await server.start();
  } catch (err) {
    console.error('Failed to start server:', err);
  }
});

afterAll(async () => {
  try {
    await new Promise<void>((resolve, reject) => {
      server.close();
      resolve();
    });
  } catch (err) {
    console.error('Failed to close server:', err);
  }
});
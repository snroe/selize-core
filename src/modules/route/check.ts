import { hashFile, IncrementalHasher } from '@selize/utils';
import path from 'path';
import fs from 'fs-extra';

const rootDir = process.cwd();
const routeDir = path.join(rootDir, 'src');
const routeFile = path.join(rootDir, '.selize', 'routes.json');

const hasher = new IncrementalHasher();

export const selizeRouteCheck = async (): Promise<void> => {
  const routes = await fs.readJSON(routeFile);

  for (const route of routes) {
    const { handlerModule } = route;

    const moduleHash = await hasher.hashDir(routeDir, { algorithm: "sha256" });
    const handlerHash = await hasher.hashDir(handlerModule, { algorithm: "sha256" });

    if (moduleHash !== route.moduleHash || handlerHash !== route.handlerHash) {
      await fs.writeJSON(routeFile, routes, { spaces: 2 })
    }
  }
}
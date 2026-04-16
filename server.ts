import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const angularApp = new AngularNodeAppEngine();

  server.get(
    '**',
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
      redirect: false,
    }),
  );

  server.get(
    '**',
    createNodeRequestHandler(async (req, res, next) => {
      const response = await angularApp.handle(req);
      if (response) {
        await writeResponseToNodeResponse(response, res);
      } else {
        next();
      }
    }),
  );

  return server;
}

const server = app();

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  server.listen(port, () => {
    console.log(`SSR server running on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(server);

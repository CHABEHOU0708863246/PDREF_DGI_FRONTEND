import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import compression from 'compression';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const app = express();
const angularApp = new AngularNodeAppEngine();
const apiOrigin = process.env['API_ORIGIN'] ?? '';

app.use(compression());

app.use((request, response, next) => {
  const connectSources = ["'self'", apiOrigin].filter(Boolean).join(' ');
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data:",
    `connect-src ${connectSources}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.setHeader('Content-Security-Policy', csp);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    immutable: true,
    index: false,
    redirect: false,
  }),
);

app.use((request, response, next) => {
  angularApp
    .handle(request)
    .then((angularResponse) =>
      angularResponse ? writeResponseToNodeResponse(angularResponse, response) : next(),
    )
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] ?? 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    process.stdout.write(`PDREF SSR listening on http://localhost:${port}\n`);
  });
}

export const reqHandler = createNodeRequestHandler(app);

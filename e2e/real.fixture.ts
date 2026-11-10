import { test as base } from '@playwright/test';

const MOCK_ERROR =
  'MOCK_INTERDIT: le projet Playwright real ne doit utiliser ni page.route ni context.route.';

export const test = base.extend({
  mockGuard: [
    async ({ page }: { page: import('@playwright/test').Page }, use: () => Promise<void>) => {
      const fail = (): never => {
        throw new Error(MOCK_ERROR);
      };
      page.route = fail as typeof page.route;
      page.unroute = fail as typeof page.unroute;
      const context = page.context();
      context.route = fail as any;
      context.unroute = fail as any;
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';

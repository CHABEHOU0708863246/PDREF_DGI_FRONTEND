import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

const profile = {
  id: 'u-workflow',
  login: 'admin.workflow',
  displayName: 'Administrateur Workflow',
  email: 'admin@example.test',
  directionId: null,
  directionCode: null,
  mustChangePassword: false,
  roles: ['ADMINISTRATEUR_DSI'],
  permissions: ['Workflows_Read'],
};

const workflow = {
  id: 'w1',
  code: 'parallele-v1',
  versionDef: 1,
  status: 'ACTIVE',
  name: 'Circuit parallele',
  description: 'Circuit cible',
  sourceRef: 'REF-7',
  provisional: true,
  featureFlag: { key: 'workflow.variantes', enabled: false },
  steps: [
    {
      code: 'CONFORMITE_AUTO',
      name: 'Conformite automatique',
      kind: 'AUTO',
      orderNumber: 10,
      delayParameterKey: null,
      roleCodes: [],
      prerequisiteStepCodes: [],
      groupCode: null,
      isTerminal: false,
      isEarlyExit: false,
    },
    {
      code: 'VERIF_GUDEF',
      name: 'Verification GUDEF',
      kind: 'LINEAIRE',
      orderNumber: 20,
      delayParameterKey: 'delais.verifGudefJO',
      roleCodes: ['AGENT_GUDEF'],
      prerequisiteStepCodes: ['CONFORMITE_AUTO'],
      groupCode: null,
      isTerminal: false,
      isEarlyExit: false,
    },
  ],
  joins: [
    {
      code: 'AVIS_JOIN',
      groupCode: 'AVIS',
      branchStepCodes: ['AVIS_DERAR', 'AVIS_DVFN'],
      nextStepCode: 'VALIDATION_GLOBALE_GUDEF',
      nonFavorableStepCode: 'NON_FAVORABLE',
      stopAtFirstParameterKey: 'workflow.arretAuPremierNonFavorable',
    },
  ],
  createdAt: '2026-11-06T00:00:00Z',
  updatedAt: null,
  version: 1,
};

const cors = {
  'access-control-allow-origin': 'http://localhost:4200',
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': 'content-type,x-correlation-id',
  'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
  'content-type': 'application/json',
};

async function json(route: Route, data: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    headers: cors,
    body: JSON.stringify({ success: true, data }),
  });
}

async function mockApi(page: Page): Promise<void> {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'localhost' || url.port !== '5080') {
      await route.continue();
      return;
    }
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors });
      return;
    }
    if (url.pathname.endsWith('/auth/refresh')) {
      await json(route, { accessToken: 'e2e-workflow', expiresAt: '2030-01-01T00:00:00Z' });
      return;
    }
    if (url.pathname.endsWith('/me')) {
      await json(route, profile);
      return;
    }
    if (url.pathname.endsWith('/workflows')) {
      await json(route, [workflow]);
      return;
    }
    await json(route, {});
  });
}

test.describe('workflows', () => {
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ]) {
    test(`ecran workflows accessible en ${viewport.width}px`, async ({ page }) => {
      await mockApi(page);
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/admin/workflows');
      await expect(page.getByRole('heading', { name: 'Workflows' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Circuit parallele' })).toBeVisible();
      await expect(page.getByText('Verification GUDEF')).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
      const noOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      );
      expect(noOverflow).toBe(true);
    });
  }
});

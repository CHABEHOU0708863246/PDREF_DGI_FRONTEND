import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

const profile = {
  id: 'u-contrib',
  login: 'admin.contrib',
  displayName: 'Administrateur Contribuables',
  email: 'admin@example.test',
  directionId: null,
  directionCode: null,
  mustChangePassword: false,
  roles: ['ADMINISTRATEUR_DSI'],
  permissions: [
    'Contribuables_Read',
    'Contribuables_ReadPii',
    'Contribuables_Create',
    'Contribuables_Update',
    'Contribuables_Archive',
    'Contribuables_Export',
    'Contribuables_Sync',
  ],
};

const contribuable = {
  id: 'c1',
  ncc: '1234567A',
  raisonSociale: 'Client Alpha',
  systemeComptable: 'SYSCOHADA',
  centreImpotId: 'c-gudef',
  centreImpotLibelle: 'GUDEF',
  directionRattachementId: 'd-gudef',
  secteur: 'SERVICE',
  formeJuridique: 'SA',
  zoneId: null,
  adresse: 'Abidjan',
  emailMasque: 'j***@example.ci',
  telephoneMasque: '***12',
  email: null,
  telephone: null,
  emailManquant: false,
  telephoneManquant: false,
  nccHorsFormat: false,
  centreRattachementManquant: false,
  evalueLe: '2026-11-01T00:00:00Z',
  isArchived: false,
  archivedAt: null,
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
      await json(route, { accessToken: 'e2e-contrib', expiresAt: '2030-01-01T00:00:00Z' });
      return;
    }
    if (url.pathname.endsWith('/me')) {
      await json(route, profile);
      return;
    }
    if (url.pathname.endsWith('/contribuables/qualite')) {
      await json(route, {
        total: 1,
        sansEmail: 0,
        sansTelephone: 0,
        sansCentre: 0,
        nccHorsFormat: 0,
        pourcentageSansEmail: 0,
        pourcentageSansTelephone: 0,
        pourcentageSansCentre: 0,
        pourcentageNccHorsFormat: 0,
      });
      return;
    }
    if (url.pathname.endsWith('/contribuables/lookup')) {
      await json(route, [{ id: 'c1', raisonSociale: 'Client Alpha', nccMasque: '123****7A' }]);
      return;
    }
    if (url.pathname.endsWith('/contribuables/c1')) {
      const revealed = url.searchParams.get('revealPii') === 'true';
      await json(route, {
        ...contribuable,
        email: revealed ? 'jean@example.ci' : null,
        telephone: revealed ? '0700000012' : null,
      });
      return;
    }
    if (url.pathname.endsWith('/contribuables') || url.pathname.endsWith('/contribuables/')) {
      await json(route, { items: [contribuable], page: 1, pageSize: 20, totalCount: 1 });
      return;
    }
    await json(route, {});
  });
}

test.describe('contribuables', () => {
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ]) {
    test(`liste contribuables accessible en ${viewport.width}px`, async ({ page }) => {
      await mockApi(page);
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/contribuables');
      await expect(page.getByRole('heading', { name: 'Contribuables' })).toBeVisible();
      await expect(page.getByText('Client Alpha')).toBeVisible();
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

  test('la fiche masque les contacts et trace la revelation', async ({ page }) => {
    await mockApi(page);
    await page.goto('/dashboard/contribuables/c1');
    await expect(page.getByRole('heading', { name: 'Fiche contribuable' })).toBeVisible();
    await expect(page.getByText('j***@example.ci')).toBeVisible();
    await page.getByRole('button', { name: 'Reveler les contacts' }).click();
    await expect(page.getByText('jean@example.ci')).toBeVisible();
    await expect(page.getByText('Contacts reveles et consultation tracee.')).toBeVisible();
  });
});

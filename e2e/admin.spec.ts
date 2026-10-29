import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const profile = {
  id: 'u-admin',
  login: 'admin',
  displayName: 'Administrateur E2E',
  email: 'admin@example.test',
  directionId: null,
  directionCode: null,
  mustChangePassword: false,
  roles: ['ADMINISTRATEUR_DSI'],
  permissions: [
    'Directions_Read',
    'Directions_Manage',
    'Exercices_Read',
    'Exercices_Manage',
    'Exercices_Activate',
    'Listes_Read',
    'Listes_Manage',
    'Parametres_Read',
    'Parametres_Manage',
    'ModelesNotifications_Read',
    'ModelesNotifications_Manage',
  ],
};

const direction = {
  id: 'd1',
  code: 'GUDEF',
  libelle: 'GUDEF',
  type: 'SERVICE',
  fonctionCircuit: 'GUDEF',
  parentDirectionCode: null,
  email: null,
  telephone: null,
  adresse: null,
  isActive: true,
  provisional: true,
  legacy: false,
  sourceRef: 'A/B',
  requiresConfirmation: true,
  version: 1,
};

const value = {
  id: 'v1',
  listeCode: 'MOTIFS_REJET',
  code: 'EMAIL_NON_DECLARE',
  libelle: 'Email non declare',
  ordre: 1,
  isActive: true,
  selectable: false,
  legacy: true,
  provisional: true,
  sourceRef: 'A/B',
  requiresConfirmation: true,
  metadonnees: null,
  version: 1,
};

const parameter = {
  id: 'p1',
  cle: 'delais.verifGudefJO',
  domaine: 'delais',
  libelle: 'Delai de verification GUDEF',
  type: 'INT',
  unite: 'JO',
  min: 0,
  max: 60,
  provisional: true,
  sourceRef: 'A/B',
  requiresConfirmation: true,
  currentVersion: {
    id: 'pv1',
    cle: 'delais.verifGudefJO',
    versionNumber: 1,
    valeurJson: '3',
    effectiveFrom: '2026-01-01T00:00:00Z',
    effectiveTo: null,
    statut: 'ACTIVE',
    motifChangement: 'Seed',
    provisional: true,
    sourceRef: 'A/B',
  },
};

async function mockAdminApi(page: Page): Promise<void> {
  const cors = {
    'access-control-allow-origin': 'http://localhost:4200',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'content-type,x-correlation-id',
    'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
    'content-type': 'application/json',
  };

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
      await route.fulfill({
        status: 200,
        headers: cors,
        body: JSON.stringify({
          success: true,
          data: { accessToken: 'e2e-admin', expiresAt: '2030-01-01T00:00:00Z' },
        }),
      });
      return;
    }
    if (url.pathname.endsWith('/me')) {
      await route.fulfill({
        status: 200,
        headers: cors,
        body: JSON.stringify({ success: true, data: profile }),
      });
      return;
    }

    const pageData = url.pathname.endsWith('/admin/directions')
      ? { items: [direction], total: 1, page: 1, pageSize: 25 }
      : url.pathname.endsWith('/admin/listes-valeurs')
        ? { items: [value], total: 1, page: 1, pageSize: 25 }
        : url.pathname.endsWith('/admin/parametres')
          ? { items: [parameter], total: 1, page: 1, pageSize: 25 }
          : { items: [], total: 0, page: 1, pageSize: 25 };

    await route.fulfill({
      status: 200,
      headers: cors,
      body: JSON.stringify({ success: true, data: pageData }),
    });
  });
}

test.describe('administration des referentiels', () => {
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ]) {
    test(`administration accessible en ${viewport.width}px`, async ({ page }) => {
      await mockAdminApi(page);
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/admin/directions');
      await expect(page.getByRole('heading', { name: 'Directions' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'GUDEF' }).first()).toBeVisible();

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

  test('les cinq ecrans sont accessibles', async ({ page }) => {
    await mockAdminApi(page);
    for (const [path, heading] of [
      ['/dashboard/admin/directions', 'Directions'],
      ['/dashboard/admin/exercices', 'Exercices fiscaux'],
      ['/dashboard/admin/listes-valeurs', 'Listes de valeurs'],
      ['/dashboard/admin/parametres', 'Parametres'],
      ['/dashboard/admin/modeles-notifications', 'Modeles de notification'],
    ]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }
    await page.goto('/dashboard/admin/listes-valeurs');
    await expect(page.getByText('Legacy · non selectionnable')).toBeVisible();
  });
});

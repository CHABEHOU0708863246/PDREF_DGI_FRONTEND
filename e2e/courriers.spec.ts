import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

const profile = {
  id: 'u-courrier',
  login: 'admin.courrier',
  displayName: 'Administrateur Courriers',
  email: 'admin@example.test',
  directionId: null,
  directionCode: null,
  mustChangePassword: false,
  roles: ['ADMINISTRATEUR_DSI'],
  permissions: ['Courriers_Read', 'Courriers_Create', 'Courriers_Update', 'Courriers_ReadInternal'],
};

const summary = {
  id: 'cr1',
  sens: 'ENTRANT',
  typeCourrier: 'COURRIER',
  numero: 'C-001',
  dateArrivee: '2026-11-05T00:00:00Z',
  dateEmission: null,
  references: null,
  expediteur: 'DGI',
  objet: 'Objet du courrier',
  imputation: 'GUDEF',
  estLie: true,
  contribuable: { id: 'c1', ncc: null, nccMasque: '123****7A', raisonSociale: 'Client Alpha' },
  createdAt: '2026-11-05T00:00:00Z',
};

const detail = {
  ...summary,
  instructionsDirecteur: 'Instruction C3',
  annotationsSdGudef: 'Annotation C3',
  demandeId: null,
  signatureStatut: null,
  signatureReference: null,
  signatureLe: null,
  depotEImpotsStatut: null,
  depotEImpotsLe: null,
  referenceDepot: null,
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

async function mockApi(page: Page, permissions = profile.permissions): Promise<void> {
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
      await json(route, { accessToken: 'e2e-courrier', expiresAt: '2030-01-01T00:00:00Z' });
      return;
    }
    if (url.pathname.endsWith('/me')) {
      await json(route, { ...profile, permissions });
      return;
    }
    if (url.pathname.endsWith('/courriers/expediteurs')) {
      await json(route, ['DGI']);
      return;
    }
    if (url.pathname.endsWith('/courriers/lookup')) {
      await json(route, [
        {
          id: 'cr1',
          numero: 'C-001',
          objet: 'Objet du courrier',
          sens: 'ENTRANT',
          typeCourrier: 'COURRIER',
          date: '2026-11-05T00:00:00Z',
        },
      ]);
      return;
    }
    if (url.pathname.endsWith('/courriers/cr1/pieces-jointes')) {
      await json(route, []);
      return;
    }
    if (url.pathname.endsWith('/courriers/cr1')) {
      await json(route, detail);
      return;
    }
    if (url.pathname.endsWith('/courriers')) {
      if (route.request().method() === 'POST') {
        await json(route, detail);
        return;
      }
      await json(route, { items: [summary], page: 1, pageSize: 20, totalCount: 1 });
      return;
    }
    await json(route, {});
  });
}

test.describe('courriers', () => {
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ]) {
    test(`liste courriers accessible en ${viewport.width}px`, async ({ page }) => {
      await mockApi(page);
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/courriers');
      await expect(page.getByRole('heading', { name: 'Courriers' })).toBeVisible();
      await expect(page.getByText('Objet du courrier')).toBeVisible();
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

  test('la fiche affiche les donnees internes avec le droit C3', async ({ page }) => {
    await mockApi(page);
    await page.goto('/dashboard/courriers/cr1');
    await expect(page.getByRole('heading', { name: 'Fiche courrier' })).toBeVisible();
    await expect(page.getByText('Instruction C3')).toBeVisible();
    await expect(page.getByText('Client Alpha')).toBeVisible();
  });

  test('la fiche masque les donnees C3 sans le droit', async ({ page }) => {
    await mockApi(page, ['Courriers_Read', 'Courriers_Update']);
    await page.goto('/dashboard/courriers/cr1');
    await expect(page.getByRole('heading', { name: 'Fiche courrier' })).toBeVisible();
    await expect(page.getByText('Instruction C3')).toHaveCount(0);
    await expect(page.getByText('Annotation C3')).toHaveCount(0);
  });

  test('cree un courrier depuis le formulaire', async ({ page }) => {
    await mockApi(page);
    await page.goto('/dashboard/courriers/nouveau');
    await page.getByLabel('Numero *').fill('C-002');
    await page.getByLabel('Expediteur *').fill('DGI');
    await page.getByLabel('Objet *').fill('Nouveau courrier');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByRole('heading', { name: 'Fiche courrier' })).toBeVisible();
  });
});

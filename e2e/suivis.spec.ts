import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

const profile = {
  id: 'u-suivis',
  login: 'sd.gudef.e2e',
  displayName: 'SD GUDEF E2E',
  email: 'sd.gudef@example.test',
  directionId: 'GUDEF',
  directionCode: 'GUDEF',
  mustChangePassword: false,
  roles: ['SD_GUDEF'],
  permissions: [
    'Suivis_Read',
    'Avis_Lire',
    'Avis_Emettre',
    'Suivis_Decide',
    'Suivis_Corriger',
    'Suivis_Transmettre',
    'Courriers_Signer',
    'Courriers_Deposer_EImpots',
  ],
};

const suivisPage = {
  items: [
    {
      id: 's-lh-1',
      demandeId: 'lh-demande-1',
      numero: '2026-0001',
      cycle: 1,
      contribuable: { ncc: '1234567A', raisonSociale: 'Client demonstration' },
      statut: 'AVIS_COMPLET',
      avisRecus: 3,
      avisTotal: 3,
      avisFavorables: 2,
      avisNonFavorables: 1,
      transmissionsCount: 1,
      etapeCourante: 'VALIDATION_GLOBALE_GUDEF',
      demandeStatut: 'EN_CIRCUIT',
      dateDepot: '2026-11-05T00:00:00Z',
      dateOuverture: '2026-11-05T00:00:00Z',
      dateCloture: null,
    },
  ],
  page: 1,
  pageSize: 20,
  totalCount: 1,
};

const detail = {
  ...suivisPage.items[0],
  avis: [
    {
      id: 'a1',
      etapeCode: 'AVIS_DERAR',
      directionId: 'DERAR',
      directionCode: 'DERAR',
      statut: 'EMIS',
      decision: 'FAVORABLE',
      motifCode: null,
      commentaire: null,
      article24: {
        insuffisanceMemeNature3Ans: false,
        engagementRedressementEnCours: false,
        avisVerificationComptabilite: false,
        verificationApprofondieEnCours: null,
      },
      emisLe: '2026-11-05T00:00:00Z',
      emisPar: 'u1',
      echeance: null,
    },
    {
      id: 'a2',
      etapeCode: 'AVIS_DVFN',
      directionId: 'DVFN',
      directionCode: 'DVFN',
      statut: 'EMIS',
      decision: 'FAVORABLE',
      motifCode: null,
      commentaire: null,
      article24: {
        insuffisanceMemeNature3Ans: false,
        engagementRedressementEnCours: false,
        avisVerificationComptabilite: false,
        verificationApprofondieEnCours: null,
      },
      emisLe: '2026-11-05T00:00:00Z',
      emisPar: 'u2',
      echeance: null,
    },
    {
      id: 'a3',
      etapeCode: 'AVIS_RATTACHEMENT',
      directionId: 'DGE',
      directionCode: 'DGE',
      statut: 'EMIS',
      decision: 'NON_FAVORABLE',
      motifCode: 'VERIFICATION_APPROFONDIE_EN_COURS',
      commentaire: 'Verification en cours',
      article24: {
        insuffisanceMemeNature3Ans: false,
        engagementRedressementEnCours: false,
        avisVerificationComptabilite: false,
        verificationApprofondieEnCours: true,
      },
      emisLe: '2026-11-05T00:00:00Z',
      emisPar: 'u3',
      echeance: null,
    },
  ],
  validationGlobale: null,
  corrections: [],
  transmissions: [],
  directionIds: ['GUDEF', 'DGE'],
  etapes: [],
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

async function mockSuivisApi(page: Page): Promise<void> {
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
      await json(route, { accessToken: 'e2e-suivis', expiresAt: '2030-01-01T00:00:00Z' });
      return;
    }
    if (url.pathname.endsWith('/me')) {
      await json(route, profile);
      return;
    }
    if (url.pathname.endsWith('/notifications/unread-count')) {
      await json(route, { count: 0 });
      return;
    }
    if (url.pathname.endsWith('/suivis/motifs')) {
      await json(route, [{ code: 'AUTRE', libelle: 'Autre' }]);
      return;
    }
    if (url.pathname.endsWith('/suivis/base-demandes')) {
      await route.fulfill({
        status: 200,
        headers: {
          ...cors,
          'content-disposition': 'attachment; filename="base-demandes.csv"',
          'content-type': 'text/csv',
        },
        body: 'numero;ncc\n2026-0001;1234567A\n',
      });
      return;
    }
    if (url.pathname.endsWith('/suivis/lh-demande-1')) {
      await json(route, detail);
      return;
    }
    if (url.pathname.endsWith('/suivis')) {
      await json(route, suivisPage);
      return;
    }
    await route.fulfill({ status: 204, headers: cors });
  });
}

const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
];

test.describe('suivis', () => {
  for (const viewport of viewports) {
    test(`liste des suivis accessible et sans violation axe en ${viewport.width}px`, async ({
      page,
    }) => {
      await mockSuivisApi(page);
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/suivis');
      await expect(page.getByRole('heading', { name: 'Suivis', exact: true })).toBeVisible();
      await expect(page.getByText('2026-0001')).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);

      const noOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      );
      expect(noOverflow).toBe(true);
    });

    test(`detail du suivi accessible et sans violation axe en ${viewport.width}px`, async ({
      page,
    }) => {
      await mockSuivisApi(page);
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/suivis/lh-demande-1');
      await expect(page.getByRole('heading', { name: 'Avis des directions' })).toBeVisible();
      await expect(page.getByText(/3 ans :/).first()).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);

      const noOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      );
      expect(noOverflow).toBe(true);
    });

    test(`correction accessible et sans violation axe en ${viewport.width}px`, async ({ page }) => {
      await mockSuivisApi(page);
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/suivis/lh-demande-1/corriger');
      await expect(page.getByRole('heading', { name: /Correction/ })).toBeVisible();
      await expect(page.getByText('Decision a corriger')).toBeVisible();
      await expect(page.getByLabel('Comparaison avant apres')).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);

      const noOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      );
      expect(noOverflow).toBe(true);
    });

    test(`validation globale accessible et sans violation axe en ${viewport.width}px`, async ({
      page,
    }) => {
      await mockSuivisApi(page);
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/suivis/lh-demande-1/validation');
      await expect(page.getByRole('heading', { name: /Validation globale/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Jointure des avis' })).toBeVisible();

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

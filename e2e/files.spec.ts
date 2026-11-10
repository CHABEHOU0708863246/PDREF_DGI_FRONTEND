import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const profile = {
  id: 'u-files',
  login: 'admin',
  displayName: 'Administrateur Fichiers',
  email: 'admin@example.test',
  directionId: null,
  directionCode: null,
  mustChangePassword: false,
  roles: ['ADMINISTRATEUR_DSI'],
  permissions: ['Files_Read', 'Files_Upload', 'Files_Delete'],
};

const group = {
  id: 'g1',
  ownerType: null,
  ownerId: null,
  currentVersion: 1,
  currentFile: {
    id: 'v1',
    fileGroupId: 'g1',
    versionNumber: 1,
    originalName: 'facture.pdf',
    detectedContentType: 'application/pdf',
    sizeBytes: 1200,
    sha256: 'hash',
    status: 'PROPRE',
    scanStatus: 'PROPRE',
    createdAt: '2026-11-01T00:00:00Z',
  },
};

async function mockFilesApi(page: Page): Promise<void> {
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
          data: { accessToken: 'e2e-files', expiresAt: '2030-01-01T00:00:00Z' },
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
    if (url.pathname.endsWith('/files/policy')) {
      await route.fulfill({
        status: 200,
        headers: cors,
        body: JSON.stringify({
          success: true,
          data: {
            maximumFiles: 10,
            maximumFileSizeBytes: 2097152,
            maximumTotalSizeBytes: 5242880,
            minimumPdfCount: 0,
            allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          },
        }),
      });
      return;
    }
    if (url.pathname.endsWith('/files')) {
      await route.fulfill({
        status: 200,
        headers: cors,
        body: JSON.stringify({ success: true, data: [group] }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: cors,
      body: JSON.stringify({ success: true, data: group }),
    });
  });
}

test.describe('fichiers', () => {
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ]) {
    test(`fichiers accessibles en ${viewport.width}px`, async ({ page }) => {
      await mockFilesApi(page);
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/files');
      await expect(page.getByRole('heading', { level: 1, name: 'Fichiers' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'facture.pdf' })).toBeVisible();

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

  test('expose telechargement et suppression logique', async ({ page }) => {
    await mockFilesApi(page);
    await page.goto('/dashboard/files');
    await expect(page.getByRole('button', { name: 'Telecharger' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Supprimer' })).toBeVisible();
    await expect(page.getByRole('button', { name: /modifier/i })).toHaveCount(0);
  });
});

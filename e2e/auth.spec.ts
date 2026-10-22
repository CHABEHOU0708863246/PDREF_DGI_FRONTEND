import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const profile = {
  id: 'u-e2e',
  login: 'agent.e2e',
  displayName: 'Agent E2E',
  email: 'agent.e2e@example.test',
  directionId: 'GUDEF',
  directionCode: 'GUDEF',
  mustChangePassword: false,
  roles: ['AGENT_GUDEF'],
  permissions: ['CAN_READ_OWN_PROFILE', 'CAN_CHANGE_PASSWORD'],
};

async function mockApi(page: Page, mustChangePassword = false): Promise<void> {
  await page.route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.hostname !== 'localhost' || requestUrl.port !== '5080') {
      await route.continue();
      return;
    }

    const request = route.request();
    const cors = {
      'access-control-allow-origin': 'http://localhost:4200',
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'content-type,x-correlation-id',
      'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
      'content-type': 'application/json',
    };

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors });
      return;
    }

    const path = new URL(request.url()).pathname;
    if (path.endsWith('/auth/login')) {
      await route.fulfill({
        status: 200,
        headers: cors,
        body: JSON.stringify({
          success: true,
          data: { accessToken: 'e2e-access-token', expiresAt: '2030-01-01T00:00:00Z' },
        }),
      });
      return;
    }

    if (path.endsWith('/auth/refresh')) {
      await route.fulfill({
        status: 200,
        headers: cors,
        body: JSON.stringify({
          success: true,
          data: { accessToken: 'e2e-refreshed-token', expiresAt: '2030-01-01T00:00:00Z' },
        }),
      });
      return;
    }

    if (path.endsWith('/me')) {
      await route.fulfill({
        status: 200,
        headers: cors,
        body: JSON.stringify({
          success: true,
          data: { ...profile, mustChangePassword },
        }),
      });
      return;
    }

    if (path.endsWith('/me/change-password')) {
      await route.fulfill({
        status: 200,
        headers: cors,
        body: JSON.stringify({ success: true, data: {} }),
      });
      return;
    }

    if (path.endsWith('/auth/forgot-password')) {
      await route.fulfill({
        status: 202,
        headers: cors,
        body: JSON.stringify({ success: true, data: {} }),
      });
      return;
    }

    if (path.endsWith('/auth/reset-password')) {
      await route.fulfill({
        status: 200,
        headers: cors,
        body: JSON.stringify({ success: true, data: {} }),
      });
      return;
    }

    await route.fulfill({ status: 204, headers: cors });
  });
}

test.describe('authentification', () => {
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ]) {
    test(`login accessible sans scroll horizontal en ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/auth/login');
      await expect(page.getByRole('heading', { name: 'Acceder a votre espace' })).toBeVisible();

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

  test('login, show/hide password et arrivee dashboard', async ({ page }) => {
    await mockApi(page);
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Identifiant').fill('agent.e2e');
    await page.getByLabel('Mot de passe', { exact: true }).fill('Correct-Horse-2026!');

    await page.getByRole('button', { name: 'Afficher le mot de passe' }).click();
    await expect(page.getByLabel('Mot de passe', { exact: true })).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('forgot-password reste anti-enumeration', async ({ page }) => {
    await mockApi(page);
    await page.goto('/auth/forgot-password');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Identifiant').fill('inconnu.e2e');
    await page.getByRole('button', { name: 'Envoyer le lien' }).click();
    await expect(page.getByText(/Si un compte correspond/)).toBeVisible();
  });

  test('reset-password accepte un token et navigue vers login', async ({ page }) => {
    await mockApi(page);
    await page.goto('/auth/reset-password?token=e2e-reset-token');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('New-Correct-Horse-2026!');
    await page
      .getByLabel('Confirmer le mot de passe', { exact: true })
      .fill('New-Correct-Horse-2026!');
    await page.getByRole('button', { name: 'Reinitialiser' }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('profil impose le changement initial et permet de le faire', async ({ page }) => {
    await mockApi(page, true);
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Identifiant').fill('agent.e2e');
    await page.getByLabel('Mot de passe', { exact: true }).fill('Correct-Horse-2026!');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL(/\/auth\/my-profile/);

    await page.getByLabel('Mot de passe actuel').fill('Correct-Horse-2026!');
    await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('New-Correct-Horse-2026!');
    await page
      .getByLabel('Confirmer le nouveau mot de passe', { exact: true })
      .fill('New-Correct-Horse-2026!');
    await page.getByRole('button', { name: 'Changer le mot de passe' }).click();
    await expect(page.getByText(/Mot de passe modifie/)).toBeVisible();
  });
});

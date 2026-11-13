import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from './real.fixture';
import { loadRealCredentials, mfaSecretFor, passwordFor } from './real-credentials';
import { totpForLogin } from './mfa-state';

const credentials = loadRealCredentials();
const phase = process.env['RECETTE_PHASE'] ?? 'after';
const root = join('e2e', 'artifacts', 'recette', phase);

async function loginAdmin(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel('Identifiant').fill('admin.dsi');
  await page
    .getByLabel('Mot de passe', { exact: true })
    .fill(passwordFor(credentials, 'admin.dsi'));
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/dashboard|\/auth\/mfa/, { timeout: 30_000 });
  if (page.url().includes('/auth/mfa')) {
    await page
      .locator('#mfa-code')
      .fill(await totpForLogin('admin.dsi', mfaSecretFor(credentials, 'admin.dsi')));
    await page.getByRole('button', { name: 'Verifier' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  }
}

test('captures recette interface', async ({ page }) => {
  mkdirSync(root, { recursive: true });
  await loginAdmin(page);
  const pages = [
    ['dashboard', '/dashboard'],
    ['utilisateurs', '/dashboard/admin/utilisateurs'],
    ['courriers', '/dashboard/courriers'],
    ['contribuables', '/dashboard/contribuables'],
    ['audit', '/dashboard/audit'],
  ] as const;
  for (const [name, path] of pages) {
    await page.goto(path);
    await page.waitForTimeout(1_200);
    for (const width of [1280, 360]) {
      await page.setViewportSize({ width, height: width === 360 ? 800 : 900 });
      await page.screenshot({
        path: join(root, `${name}-${width}.png`),
        fullPage: true,
      });
    }
  }
});

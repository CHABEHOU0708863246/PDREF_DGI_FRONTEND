import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
];

test.describe.configure({ timeout: 60_000 });

async function loadDeferredSections(page: Page): Promise<void> {
  await page.evaluate(async () => {
    let offset = 0;
    for (let index = 0; index < 20; index += 1) {
      const height = document.body.scrollHeight;
      while (offset < height) {
        offset += 250;
        window.scrollTo(0, offset);
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
      if (document.body.scrollHeight === height) {
        break;
      }
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
}

test.describe('design system — accessibilite et responsive', () => {
  for (const viewport of viewports) {
    test(`aucune violation axe et aucun scroll horizontal en ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/design-system-demo');
      await expect(page.getByRole('heading', { name: 'Design system PDREF' })).toBeVisible();
      await loadDeferredSections(page);

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

  test('thème clair, sombre et systeme', async ({ page }) => {
    await page.goto('/design-system-demo');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Theme sombre', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.getByRole('button', { name: 'Theme clair', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.getByRole('button', { name: 'Systeme', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);
  });

  test('erreur problem+json affiche code, detail et trace', async ({ page }) => {
    await page.goto('/design-system-demo');
    await page.getByRole('button', { name: 'Afficher une erreur' }).click();

    const toast = page.locator('.toast--error');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('DEMO_ERROR');
    await expect(toast).toContainText('demo-trace-9f2c4d1a');
    await expect(toast).toContainText('ERR-2026-DEMO');
  });

  test('etats du tableau et dialogue accessible', async ({ page }) => {
    await page.goto('/design-system-demo');
    await loadDeferredSections(page);

    await page.getByRole('button', { name: 'Vide', exact: true }).click();
    await expect(page.getByText('Aucune donnee').first()).toBeVisible();

    await page.getByRole('button', { name: 'Succes', exact: true }).click();
    await expect(page.locator('table')).toBeVisible();

    await page.getByRole('button', { name: 'Ouvrir la confirmation' }).click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('reduced motion est respecte', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/design-system-demo');
    await loadDeferredSections(page);

    const duration = await page
      .locator('.pd-skeleton')
      .first()
      .evaluate((element) => getComputedStyle(element).animationDuration);

    const seconds = duration.endsWith('ms')
      ? Number.parseFloat(duration) / 1000
      : Number.parseFloat(duration);
    expect(seconds).toBeLessThan(0.02);
  });
});

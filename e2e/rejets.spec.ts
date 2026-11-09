import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
];

test.describe('rejets', () => {
  for (const viewport of viewports) {
    test(`liste des rejets accessible en ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/rejets?lighthouse=1');
      await expect(page.getByRole('heading', { name: 'Rejets' })).toBeVisible();
      await expect(page.getByText('2026-0002')).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);

      const noOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      );
      expect(noOverflow).toBe(true);
    });

    test(`detail d'un rejet accessible en ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/rejets/lh-rejet-1?lighthouse=1');
      await expect(page.getByRole('heading', { name: 'Rejet - 2026-0002' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Historique des cycles' })).toBeVisible();

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

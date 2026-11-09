import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
];

test.describe('imports', () => {
  for (const viewport of viewports) {
    test(`liste des imports accessible en ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/imports?lighthouse=1');
      await expect(page.getByRole('heading', { name: 'Imports', exact: true })).toBeVisible();
      await expect(page.getByText('demandes-novembre.xlsx')).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);

      const noOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      );
      expect(noOverflow).toBe(true);
    });

    test(`detail d un import accessible en ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/imports/lh-import-1?lighthouse=1');
      await expect(
        page.getByRole('heading', { name: 'Import - demandes-novembre.xlsx' }),
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Erreurs par ligne' })).toBeVisible();

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

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
];

test.describe('dashboard', () => {
  for (const viewport of viewports) {
    test(`tableau de bord accessible en ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard?lighthouse=1');
      await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
      await expect(page.getByText('Total demandes')).toBeVisible();
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

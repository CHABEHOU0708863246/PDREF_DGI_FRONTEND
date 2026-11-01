import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

const profile = {
  id: 'u-notifications',
  login: 'admin',
  displayName: 'Administrateur Notifications',
  email: 'admin@example.test',
  directionId: null,
  directionCode: null,
  mustChangePassword: false,
  roles: ['ADMINISTRATEUR_DSI'],
  permissions: [],
};

const notification = {
  id: 'n1',
  eventType: 'DEPOT_ACCUSE',
  title: 'Depot enregistre',
  message: 'Votre depot a bien ete enregistre.',
  readAt: null,
  isRead: false,
  createdAt: '2026-11-01T00:00:00Z',
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

async function mockNotificationsApi(page: Page): Promise<void> {
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
      await json(route, { accessToken: 'e2e-notifications', expiresAt: '2030-01-01T00:00:00Z' });
      return;
    }
    if (url.pathname.endsWith('/me')) {
      await json(route, profile);
      return;
    }
    if (url.pathname.endsWith('/notifications/unread-count')) {
      await json(route, { count: 1 });
      return;
    }
    if (url.pathname.endsWith('/notifications/read-all')) {
      await json(route, { count: 1 });
      return;
    }
    if (url.pathname.includes('/notifications/') && url.pathname.endsWith('/read')) {
      await json(route, {});
      return;
    }
    if (url.pathname.endsWith('/notifications')) {
      const read = url.searchParams.get('read');
      const items =
        read === 'true'
          ? [{ ...notification, readAt: '2026-11-01T00:10:00Z', isRead: true }]
          : [notification];
      await json(route, {
        items,
        page: Number(url.searchParams.get('page') ?? 1),
        pageSize: 10,
        totalCount: items.length,
      });
      return;
    }
    await json(route, {});
  });
}

test.describe('notifications', () => {
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ]) {
    test(`mes notifications accessibles en ${viewport.width}px`, async ({ page }) => {
      await mockNotificationsApi(page);
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/my-notifications');
      await expect(page.getByRole('heading', { name: 'Mes notifications' })).toBeVisible();
      await expect(page.getByText('Votre depot a bien ete enregistre.')).toBeVisible();

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

  test('la cloche expose le panneau et le marquage lu', async ({ page }) => {
    await mockNotificationsApi(page);
    await page.goto('/dashboard/my-notifications');
    const trigger = page.getByRole('button', { name: /Notifications,/ });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(page.getByRole('dialog', { name: 'Notifications' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Voir toutes les notifications' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('filtre les non lues et marque une notification', async ({ page }) => {
    await mockNotificationsApi(page);
    await page.goto('/dashboard/my-notifications');
    await page.getByRole('button', { name: 'Non lues' }).click();
    await expect(page.getByText('Votre depot a bien ete enregistre.')).toBeVisible();
    await page.getByRole('button', { name: /Marquer comme lue/ }).click();
    await expect(page.getByText('Notification marquee comme lue.')).toBeVisible();
  });
});

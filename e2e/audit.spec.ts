import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const profile = {
  id: 'u-audit',
  login: 'auditeur',
  displayName: 'Auditeur E2E',
  email: 'auditeur@example.test',
  directionId: null,
  directionCode: null,
  mustChangePassword: false,
  roles: ['AUDITEUR'],
  permissions: ['CAN_READ_OWN_PROFILE', 'Audit_Read', 'Audit_Export'],
};

const event = {
  id: 'evt-1',
  eventCode: 'AUTH.LOGIN_SUCCESS',
  phase: 'OUTCOME',
  result: 'SUCCESS',
  occurredAt: '2026-10-23T10:00:00Z',
  actorUserId: 'u-audit',
  actorRoles: ['AUDITEUR'],
  targetType: 'USER',
  targetId: 'u-audit',
  requestId: 'req-1',
  correlationId: 'corr-1',
  traceId: 'trace-1',
  channel: 'HTTP',
  ipTruncated: '192.168.1.0',
  reason: null,
  changes: null,
  entryHash: 'hash',
};

async function mockAuditApi(page: Page): Promise<void> {
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
          data: { accessToken: 'e2e-audit-token', expiresAt: '2030-01-01T00:00:00Z' },
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

    if (url.pathname.endsWith('/audit/events/export')) {
      await route.fulfill({
        status: 200,
        headers: { ...cors, 'content-type': 'text/csv' },
        body: 'id,eventCode\n1,AUTH.LOGIN_SUCCESS\n',
      });
      return;
    }

    if (url.pathname.endsWith('/audit/events')) {
      await route.fulfill({
        status: 200,
        headers: cors,
        body: JSON.stringify({
          success: true,
          data: { items: [event], nextCursor: null, pageSize: 50 },
        }),
      });
      return;
    }

    await route.fulfill({ status: 204, headers: cors });
  });
}

test.describe('journal d audit', () => {
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ]) {
    test(`audit accessible en ${viewport.width}px`, async ({ page }) => {
      await mockAuditApi(page);
      await page.setViewportSize(viewport);
      await page.goto('/dashboard/audit');
      await expect(page.getByRole('heading', { name: "Journal d'audit" })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'AUTH.LOGIN_SUCCESS' })).toBeVisible();

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

  test('audit expose lecture et export, sans mutation', async ({ page }) => {
    await mockAuditApi(page);
    await page.goto('/dashboard/audit');
    await expect(page.getByRole('button', { name: 'Exporter CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exporter JSON' })).toBeVisible();
    await expect(page.getByRole('button', { name: /modifier|supprimer/i })).toHaveCount(0);
  });
});

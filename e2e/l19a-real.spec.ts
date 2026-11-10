import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from './real.fixture';
import {
  API,
  apiLogin,
  authHeaders,
  createCourrier,
  createDemande,
  createRejet,
  eicarPdfBuffer,
  getDemandeNumero,
  getRejet,
  pdfBuffer,
} from './real-api';
import { loadRealCredentials, passwordFor } from './real-credentials';

const credentials = loadRealCredentials();
const MAILPIT = 'http://localhost:8125';
const PASSWORD_CHANGE_MESSAGE = 'Le mot de passe doit etre change avant de continuer.';

async function loginAs(page: Page, login: string): Promise<void> {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: /Acceder a votre espace/i })).toBeVisible();
  const password = passwordFor(credentials, login);
  await page.getByLabel('Identifiant').fill(login);
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page.getByText(PASSWORD_CHANGE_MESSAGE)).toHaveCount(0);
}

async function loginWithPassword(page: Page, login: string, password: string): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel('Identifiant').fill(login);
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
}

async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Se deconnecter' }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
}

async function verifierGudef(page: Page, demandeId: string): Promise<void> {
  await loginAs(page, 'collab.gudef');
  await page.goto(`/dashboard/demandes/${demandeId}`);
  const button = page.getByRole('button', { name: 'Verifier GUDEF' });
  await expect(button).toBeVisible();
  const response = page.waitForResponse(
    (item) => item.url().includes('/verification-gudef') && item.request().method() === 'POST',
  );
  await button.click();
  expect((await response).ok()).toBe(true);
  await page.goto(`/dashboard/suivis/${demandeId}`);
  await expect(page.getByRole('heading', { name: 'Avis des directions' })).toBeVisible();
  await logout(page);
}

async function emettreAvis(
  page: Page,
  login: string,
  demandeId: string,
  decision: 'FAVORABLE' | 'NON_FAVORABLE' = 'FAVORABLE',
): Promise<void> {
  await loginAs(page, login);
  await page.goto(`/dashboard/suivis/${demandeId}`);
  await expect(page.getByRole('heading', { name: 'Avis des directions' })).toBeVisible();
  const card = page
    .locator('article.avis-card')
    .filter({ has: page.getByRole('button', { name: "Emettre l'avis" }) })
    .first();
  await expect(card).toBeVisible();

  if (decision === 'NON_FAVORABLE') {
    await card.getByRole('combobox', { name: 'Decision' }).selectOption('NON_FAVORABLE');
    const motif = card.getByRole('combobox', { name: 'Motif' });
    await expect(motif.locator('option', { hasText: 'Insuffisance de meme nature' })).toHaveCount(
      1,
    );
    await motif.selectOption('INSUFFISANCE_MEME_NATURE_3ANS');
    await card
      .getByRole('combobox', { name: /Insuffisance de meme nature/i })
      .selectOption({ label: 'Oui' });
  }

  const response = page.waitForResponse(
    (item) => item.url().includes('/avis/') && item.request().method() === 'POST',
  );
  await card.getByRole('button', { name: "Emettre l'avis" }).click();
  const posted = await response;
  expect(posted.ok()).toBe(true);
  await logout(page);
}

async function validerFavorable(page: Page, demandeId: string): Promise<void> {
  await loginAs(page, 'sd.gudef');
  await page.goto(`/dashboard/suivis/${demandeId}/validation`);
  await expect(page.getByRole('heading', { name: /Validation globale/ })).toBeVisible();
  const response = page.waitForResponse(
    (item) => item.url().includes('/validation') && item.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Valider' }).click();
  expect((await response).ok()).toBe(true);
  await logout(page);
}

async function activerCtfEtCloturer(page: Page, demandeId: string): Promise<void> {
  await loginAs(page, 'chef.ctf');
  await page.goto(`/dashboard/ctf/${demandeId}`);
  await expect(page.getByRole('heading', { name: /CTF - / })).toBeVisible();
  await page.getByRole('textbox', { name: /Reference e-impots/i }).fill('EIMP-E2E-ACT');
  const activation = page.waitForResponse(
    (item) => item.url().includes('/activation-manuelle') && item.request().method() === 'POST',
  );
  await page.getByRole('button', { name: "Declarer l'activation" }).click();
  expect((await activation).ok()).toBe(true);
  await expect(page.getByText('Contribuable informe', { exact: true })).toBeVisible();
  await logout(page);

  await loginAs(page, 'chef.ctf');
  await page.goto(`/dashboard/ctf/${demandeId}`);
  const retour = page.waitForResponse(
    (item) => item.url().includes('/retour-gudef') && item.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Retour GUDEF' }).click();
  expect((await retour).ok()).toBe(true);
  await logout(page);

  await loginAs(page, 'chef.ctf');
  await page.goto(`/dashboard/ctf/${demandeId}`);
  await page.getByRole('textbox', { name: /Reference depot rectifie/i }).fill('EIMP-E2E-DEP');
  const depot = page.waitForResponse(
    (item) => item.url().includes('/depot-rectifie-manuel') && item.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Declarer le depot rectifie' }).click();
  expect((await depot).ok()).toBe(true);
  await logout(page);
}

async function waitForPublicStatus(
  request: APIRequestContext,
  ncc: string,
  email: string,
  status: string,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const response = await request.post(`${API}/public/suivi`, { data: { ncc, email } });
        if (!response.ok()) {
          return `HTTP ${response.status()}`;
        }
        const body = (await response.json()) as {
          data?: { dossiers?: { statut: string }[] };
        };
        return body.data?.dossiers?.some((item) => item.statut === status) ? status : body;
      },
      { timeout: 45_000, intervals: [1_000, 2_000, 3_000] },
    )
    .toBe(status);
}

async function verifierStatutPublic(
  page: Page,
  ncc: string,
  email: string,
  status: string,
): Promise<void> {
  await page.goto('/suivi');
  await page.getByLabel('NCC').fill(ncc);
  await page.getByLabel('E-mail').fill(email);
  await page.getByRole('button', { name: 'Rechercher' }).click();
  await expect(page.getByText(status).first()).toBeVisible();
}

test.describe('L19a - recette sur la vraie pile', () => {
  test('garde-fou anti-mock actif', async ({ page }) => {
    expect(() => page.route('**/*', (route) => route.continue())).toThrow(/MOCK_INTERDIT/);
  });

  test('fichier EICAR refuse par le vrai ClamAV', async ({ request }) => {
    const token = await apiLogin(request, 'chef.ctf', passwordFor(credentials, 'chef.ctf'));
    const response = await request.post(`${API}/files`, {
      headers: authHeaders(token),
      multipart: {
        ownerType: 'CTF',
        ownerId: 'eicar-e2e',
        file: {
          name: 'eicar.pdf',
          mimeType: 'application/pdf',
          buffer: eicarPdfBuffer(),
        },
      },
    });
    const body = await response.text();
    expect(response.status()).toBe(422);
    expect(body).toMatch(/FILE_SCAN_INFECTED|infecte/i);
  });

  test('parcours favorable complet en mode manuel', async ({ page, request }) => {
    const token = await apiLogin(request, 'agent.gudef', passwordFor(credentials, 'agent.gudef'));
    const courrier = await createCourrier(request, token, '1234567A', 'favorable');
    const demandeId = await createDemande(request, token, '1234567A', courrier.id, 'favorable');

    await verifierGudef(page, demandeId);
    await emettreAvis(page, 'decideur.dvfn', demandeId);
    await emettreAvis(page, 'decideur.derar', demandeId);
    await emettreAvis(page, 'directeur.dme', demandeId);
    await validerFavorable(page, demandeId);
    await activerCtfEtCloturer(page, demandeId);

    await waitForPublicStatus(request, '1234567A', 'boulangerie@example.test', 'CLOTUREE');
    await verifierStatutPublic(page, '1234567A', 'boulangerie@example.test', 'CLOTUREE');
  });

  test('parcours non favorable complet avec signature et remise', async ({ page, request }) => {
    const token = await apiLogin(request, 'agent.gudef', passwordFor(credentials, 'agent.gudef'));
    const courrier = await createCourrier(request, token, '7654321B', 'nonfavorable');
    const demandeId = await createDemande(request, token, '7654321B', courrier.id, 'nonfavorable');

    await verifierGudef(page, demandeId);
    await emettreAvis(page, 'decideur.dvfn', demandeId, 'NON_FAVORABLE');
    await emettreAvis(page, 'decideur.derar', demandeId);
    await emettreAvis(page, 'directeur.dme', demandeId);

    await loginAs(page, 'dg');
    await page.goto('/dashboard/courriers/a-signer');
    await expect(page.getByRole('heading', { name: 'Courriers a signer' })).toBeVisible();
    await page.getByRole('link', { name: 'Deposer le PDF signe' }).first().click();
    await page.waitForURL(/\/dashboard\/courriers\/[a-f0-9]{24}/);
    const courrierId = new URL(page.url()).pathname.split('/').pop();
    if (!courrierId) {
      throw new Error('Identifiant courrier absent.');
    }
    const section = page
      .locator('section.pd-card')
      .filter({ hasText: 'Deposer le courrier signe' });
    await section.getByLabel('Signataire declare').fill('Directeur General');
    const signature = page.waitForResponse(
      (item) => item.url().includes('/signature') && item.request().method() === 'POST',
    );
    await section.locator('input[type="file"]').setInputFiles({
      name: 'signe.pdf',
      mimeType: 'application/pdf',
      buffer: pdfBuffer('Courrier signe'),
    });
    expect((await signature).ok()).toBe(true);
    await logout(page);

    await loginAs(page, 'agent.gudef');
    await page.goto(`/dashboard/courriers/${courrierId}`);
    await page.getByLabel('Canal').selectOption('REMISE_PAPIER');
    await page.getByLabel('Reference', { exact: true }).last().fill('REM-E2E-1');
    const remise = page.waitForResponse(
      (item) => item.url().includes('/remise') && item.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Declarer la remise' }).click();
    expect((await remise).ok()).toBe(true);
    await logout(page);

    await waitForPublicStatus(request, '7654321B', 'garage@example.test', 'CLOTUREE');
    await verifierStatutPublic(page, '7654321B', 'garage@example.test', 'CLOTUREE');
  });

  test('parcours rejet automatique', async ({ page, request }) => {
    const token = await apiLogin(request, 'agent.gudef', passwordFor(credentials, 'agent.gudef'));
    const courrier = await createCourrier(request, token, '1111111C', 'auto');
    await createDemande(request, token, '1111111C', courrier.id, 'auto');

    await waitForPublicStatus(request, '1111111C', 'imprimerie@example.test', 'REJETEE');
    await verifierStatutPublic(page, '1111111C', 'imprimerie@example.test', 'REJETEE');
  });

  test('parcours rejet par agent puis reprise cycle 2', async ({ page, request }) => {
    const token = await apiLogin(request, 'agent.gudef', passwordFor(credentials, 'agent.gudef'));
    const courrier = await createCourrier(request, token, '1234567A', 'reprise');
    const demandeId = await createDemande(request, token, '1234567A', courrier.id, 'reprise');
    const numero = await getDemandeNumero(request, token, demandeId);
    const rejetId = await createRejet(request, token, demandeId);

    await loginAs(page, 'agent.gudef');
    await page.goto('/dashboard/rejets');
    await expect(page.getByRole('heading', { name: 'Rejets' })).toBeVisible();
    const row = page.locator('tr').filter({ hasText: numero }).first();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Reprendre' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const reprise = page.waitForResponse(
      (item) => item.url().includes('/reprendre') && item.request().method() === 'POST',
    );
    await dialog.getByRole('button', { name: 'Reprendre' }).click();
    expect((await reprise).ok()).toBe(true);
    await logout(page);

    await expect
      .poll(async () => (await getRejet(request, token, rejetId)).statut, { timeout: 20_000 })
      .toBe('CORRIGE');
    const rejet = await getRejet(request, token, rejetId);
    expect(rejet.cycleCourant).toBeGreaterThanOrEqual(2);
  });

  test('creation, invitation Mailpit, connexion limitee et desactivation', async ({
    page,
    request,
    browser,
  }) => {
    const suffix = Date.now().toString().slice(-8);
    const matricule = `agent.dvfn.${suffix}`;
    const email = `${matricule}@test.ci`;
    const password = 'New-Password-2026!';

    await loginAs(page, 'admin.dsi');
    await page.goto('/dashboard/admin/utilisateurs');
    await page.getByRole('button', { name: 'Nouvel utilisateur' }).click();
    const form = page.locator('section.users-form');
    await form.getByLabel('Prenom', { exact: true }).fill('Agent');
    await form.getByLabel('Nom', { exact: true }).fill('DVFN');
    await form.getByLabel('Email', { exact: true }).fill(email);
    await form.getByLabel('Matricule', { exact: true }).fill(matricule);
    await form.getByLabel('Fonction', { exact: true }).fill('Decideur');
    const directionOption = form.locator('option').filter({ hasText: 'DVFN' }).first();
    await form.getByLabel('Direction').selectOption((await directionOption.getAttribute('value'))!);
    await form.getByRole('checkbox', { name: 'Decideur DVFN' }).check();
    const created = page.waitForResponse(
      (item) =>
        item.url().includes('/api/v1/admin/identity/users') && item.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    expect((await created).ok()).toBe(true);
    await logout(page);

    let messageId = '';
    await expect
      .poll(
        async () => {
          const response = await request.get(`${MAILPIT}/api/v1/messages`);
          if (!response.ok()) {
            return '';
          }

          const body = (await response.json()) as {
            messages?: { ID: string; To?: { Address?: string }[] | string }[];
          };
          for (const message of body.messages ?? []) {
            const recipients = Array.isArray(message.To)
              ? message.To.map((item) => item.Address)
              : [message.To];
            if (recipients.includes(email)) {
              messageId = message.ID;
              return messageId;
            }
          }

          return '';
        },
        { timeout: 30_000, intervals: [500, 1_000, 2_000] },
      )
      .not.toBe('');

    const detail = await request.get(`${MAILPIT}/api/v1/message/${messageId}`);
    const detailBody = (await detail.json()) as { HTML?: string; Text?: string };
    const link = `${detailBody.HTML ?? ''} ${detailBody.Text ?? ''}`.match(
      /http:\/\/localhost:4200\/auth\/reset-password\?token=[^"<\s]+/,
    )?.[0];
    expect(link).toBeTruthy();

    const userContext = await browser.newContext({ baseURL: 'http://localhost:4200' });
    const userPage = await userContext.newPage();
    await userPage.goto(link!);
    await userPage.getByLabel('Nouveau mot de passe', { exact: true }).fill(password);
    await userPage.getByLabel('Confirmer le mot de passe', { exact: true }).fill(password);
    const reset = userPage.waitForResponse(
      (item) =>
        item.url().includes('/api/v1/auth/reset-password') && item.request().method() === 'POST',
    );
    await userPage.getByRole('button', { name: 'Reinitialiser' }).click();
    expect((await reset).ok()).toBe(true);

    await loginWithPassword(userPage, matricule, password);
    const navigation = userPage.getByRole('navigation', { name: 'Navigation principale' });
    await expect(navigation.getByRole('link')).toHaveCount(1);
    await expect(navigation.getByRole('link', { name: 'Avis à rendre' })).toBeVisible();

    await loginAs(page, 'admin.dsi');
    await page.goto('/dashboard/admin/utilisateurs');
    await page.getByLabel('Recherche').fill(matricule);
    await page.getByRole('button', { name: 'Filtrer' }).click();
    const row = page.locator('tr').filter({ hasText: matricule }).first();
    await expect(row).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept());
    const deactivated = page.waitForResponse(
      (item) => item.url().includes('/deactivate') && item.request().method() === 'POST',
    );
    await row.getByRole('button', { name: 'Desactiver' }).click();
    expect((await deactivated).ok()).toBe(true);

    await userPage.goto('/dashboard/suivis');
    await expect(userPage).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
    await userContext.close();
  });
});

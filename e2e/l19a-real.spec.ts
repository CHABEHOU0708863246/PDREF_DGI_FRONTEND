import AxeBuilder from '@axe-core/playwright';
import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from './real.fixture';
import {
  API,
  apiData,
  apiLogin,
  authHeaders,
  createCourrier,
  createDemande,
  eicarPdfBuffer,
  getDemandeNumero,
  getRejet,
  pdfBuffer,
} from './real-api';
import { totpForLogin } from './mfa-state';
import { loadRealCredentials, mfaSecretFor, passwordFor } from './real-credentials';
import { totp } from './totp';

const credentials = loadRealCredentials();
const MAILPIT = 'http://localhost:8125';
const PASSWORD_CHANGE_MESSAGE = 'Le mot de passe doit etre change avant de continuer.';
let favorableDossierNumber = '';

async function loginAs(page: Page, login: string): Promise<void> {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: /Acceder a votre espace/i })).toBeVisible();
  const password = passwordFor(credentials, login);
  await page.getByLabel('Identifiant').fill(login);
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/dashboard|\/auth\/mfa/, { timeout: 30_000 });
  if (page.url().includes('/auth/mfa')) {
    const secret = mfaSecretFor(credentials, login);
    const codeInput = page.locator('#mfa-code');
    await codeInput.fill(await totpForLogin(login, secret));
    await page.getByRole('button', { name: 'Verifier' }).click();
    try {
      await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    } catch {
      await page.waitForTimeout(31_000);
      await codeInput.fill(await totpForLogin(login, secret));
      await page.getByRole('button', { name: 'Verifier' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    }
  }

  await expect(page.getByText(PASSWORD_CHANGE_MESSAGE)).toHaveCount(0);
}

async function loginWithPassword(page: Page, login: string, password: string): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel('Identifiant').fill(login);
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/dashboard|\/auth\/mfa/, { timeout: 30_000 });
}

async function enrollNewUser(page: Page): Promise<string[]> {
  await expect(page).toHaveURL(/\/auth\/mfa\/enrollment/, { timeout: 30_000 });
  const secret = (await page.locator('.mfa-card__secret code').innerText()).trim();
  await page.getByLabel('Premier code').fill(totp(secret));
  await page.getByRole('button', { name: "J'active la double authentification" }).click();
  await expect(page).toHaveURL(/\/auth\/mfa\/recovery-codes/, { timeout: 30_000 });
  const codes = await page.locator('.mfa-card__codes code').allInnerTexts();
  expect(codes).toHaveLength(10);
  await page.getByRole('button', { name: "J'ai note mes codes" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  return codes;
}

async function logout(page: Page): Promise<void> {
  const closePanel = page.getByRole('button', { name: 'Fermer le panneau' });
  if (await closePanel.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await expect(closePanel).toBeHidden();
  }
  await page.getByRole('button', { name: 'Se deconnecter' }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
}

async function attribuerGudef(page: Page, numero: string): Promise<void> {
  await loginAs(page, 'sd.gudef');
  await page.goto('/dashboard/imputations');
  const row = page.locator('tr').filter({ hasText: numero }).first();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: /Attribuer/ }).click();
  const panel = page.locator('section.assign-panel');
  await expect(panel).toBeVisible();
  await panel.getByRole('combobox', { name: 'Agent' }).selectOption({ label: 'M. Yao' });
  const response = page.waitForResponse(
    (item) => item.url().includes('/attribuer') && item.request().method() === 'POST',
  );
  await panel.getByRole('button', { name: /Attribuer/ }).click();
  expect((await response).ok()).toBe(true);
  await logout(page);
}

async function rejeterParAgent(page: Page, demandeId: string): Promise<string> {
  await loginAs(page, 'agent.gudef');
  await page.goto(`/dashboard/demandes/${demandeId}`);
  await page.getByRole('button', { name: 'Rejeter', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Rejeter le dossier' });
  await expect(dialog).toBeVisible();
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(audit.violations, 'axe rejet').toEqual([]);
  await dialog.getByLabel(/Motif obligatoire/i).selectOption({ index: 1 });
  await dialog
    .getByLabel(/Commentaire obligatoire/i)
    .fill('Rejet de controle GUDEF pour dossier incomplet.');
  const response = page.waitForResponse(
    (item) => item.url().includes('/rejets') && item.request().method() === 'POST',
  );
  await dialog.getByRole('button', { name: 'Confirmer le rejet' }).click();
  const result = await response;
  expect(result.ok()).toBe(true);
  const body = (await result.json()) as { data: { id: string } };
  await logout(page);
  return body.data.id;
}
async function verifierGudef(page: Page, demandeId: string): Promise<void> {
  await loginAs(page, 'agent.gudef');
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

  await page.goto(`/dashboard/ctf/${demandeId}`);
  const retour = page.waitForResponse(
    (item) => item.url().includes('/retour-gudef') && item.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Retour GUDEF' }).click();
  expect((await retour).ok()).toBe(true);

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

async function waitForMailpitLink(
  request: APIRequestContext,
  email: string,
  pattern: RegExp,
): Promise<string> {
  let link = '';
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
          if (!recipients.includes(email)) {
            continue;
          }

          const detail = await request.get(`${MAILPIT}/api/v1/message/${message.ID}`);
          const detailBody = (await detail.json()) as { HTML?: string; Text?: string };
          const found = `${detailBody.HTML ?? ''} ${detailBody.Text ?? ''}`.match(pattern)?.[0];
          if (found) {
            link = found;
            return link;
          }
        }

        return '';
      },
      { timeout: 45_000, intervals: [500, 1_000, 2_000] },
    )
    .not.toBe('');
  return link;
}

async function creerCompteContribuable(
  request: APIRequestContext,
  ncc: string,
  email: string,
  password: string,
): Promise<void> {
  const adminToken = await apiLogin(
    request,
    'admin.dsi',
    passwordFor(credentials, 'admin.dsi'),
    mfaSecretFor(credentials, 'admin.dsi'),
  );
  const created = await request.post(`${API}/contribuables`, {
    headers: authHeaders(adminToken),
    data: {
      ncc,
      raisonSociale: `Entreprise ${ncc}`,
      systemeComptable: 'SYSCOHADA',
      centreImpotId: 'GUDEF',
      email,
      telephone: '+2250700000022',
    },
  });
  expect([200, 201, 409]).toContain(created.status());

  const demande = await request.post(`${API}/public/adhesions`, {
    data: {
      ncc,
      nom: 'Diallo',
      prenom: 'Awa',
      fonction: 'Gerante',
      email,
      telephone: '+2250700000022',
    },
  });
  expect([200, 202]).toContain(demande.status());

  const adhesionLink = await waitForMailpitLink(
    request,
    email,
    /http:\/\/localhost:4200\/adhesion\?token=[^"<\s]+/,
  );
  const token = new URL(adhesionLink).searchParams.get('token');
  expect(token).toBeTruthy();
  const verify = await request.post(`${API}/public/adhesions/verifier-email`, {
    data: { token },
  });
  expect(verify.ok()).toBe(true);
  const verifyBody = (await verify.json()) as {
    data: { jeton: string };
  };
  const jeton = verifyBody.data.jeton;

  for (const type of ['AUTORISATION_MANDATAIRE', 'PIECE_IDENTITE']) {
    const upload = await request.post(`${API}/public/adhesions/pieces`, {
      headers: { 'X-Adhesion-Token': jeton },
      multipart: {
        type,
        file: {
          name: `${type}.pdf`,
          mimeType: 'application/pdf',
          buffer: pdfBuffer(type),
        },
      },
    });
    expect(upload.ok()).toBe(true);
  }

  const submit = await request.post(`${API}/public/adhesions/soumettre`, {
    headers: { 'X-Adhesion-Token': jeton },
    data: {},
  });
  expect(submit.ok()).toBe(true);

  const agentToken = await apiLogin(
    request,
    'agent.gudef',
    passwordFor(credentials, 'agent.gudef'),
    mfaSecretFor(credentials, 'agent.gudef'),
  );
  const accounts = await apiData<{ userId: string; isActive: boolean }[]>(
    request,
    agentToken,
    'get',
    `/adhesions/comptes?search=${encodeURIComponent(ncc)}`,
  );
  for (const account of accounts) {
    if (account.isActive) {
      const disabled = await request.post(`${API}/adhesions/comptes/${account.userId}/desactiver`, {
        headers: authHeaders(agentToken),
        data: { motif: 'Recette L23 - remplacement du compte' },
      });
      expect(disabled.ok()).toBe(true);
    }
  }
  const adhesions = await apiData<{ id: string }[]>(
    request,
    agentToken,
    'get',
    `/adhesions?statut=EN_ATTENTE_VALIDATION&search=${encodeURIComponent(ncc)}`,
  );
  const adhesion = adhesions.find((item) => item.id);
  expect(adhesion).toBeTruthy();
  const accept = await request.post(`${API}/adhesions/${adhesion!.id}/accepter`, {
    headers: authHeaders(agentToken),
    data: {},
  });
  const acceptText = await accept.text();
  expect(accept.ok(), acceptText).toBe(true);

  const invitation = await waitForMailpitLink(
    request,
    email,
    /http:\/\/localhost:4200\/auth\/reset-password\?token=[^"<\s]+/,
  );
  const resetToken = new URL(invitation).searchParams.get('token');
  const reset = await request.post(`${API}/auth/reset-password`, {
    data: { token: resetToken, newPassword: password },
  });
  expect(reset.ok()).toBe(true);
}

test.describe('L19a - recette sur la vraie pile', () => {
  test('garde-fou anti-mock actif', async ({ page }) => {
    expect(() => page.route('**/*', (route) => route.continue())).toThrow(/MOCK_INTERDIT/);
  });

  test('session conservee au rafraichissement et reconnexion', async ({ page }) => {
    await loginAs(page, 'agent.gudef');
    await page.goto('/dashboard/suivis');
    await expect(page.getByRole('heading', { name: 'Suivis' })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/dashboard\/suivis/);
    await expect(page.getByRole('heading', { name: 'Suivis' })).toBeVisible();

    await logout(page);
    await page.reload();
    await expect(page).toHaveURL(/\/auth\/login/);
    await loginAs(page, 'agent.gudef');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.context().clearCookies();
    await page.goto('/dashboard/suivis');
    await expect(page).toHaveURL(/\/auth\/login\?.*expired=1/);
    await expect(
      page.getByText('Votre session a expire. Reconnectez-vous pour continuer.'),
    ).toBeVisible();
  });

  test('ecran e-mails et envoi de test via Mailpit', async ({ page, request }) => {
    const recipient = `recette.emails.${Date.now()}@example.test`;
    await loginAs(page, 'admin.dsi');
    await page.goto('/dashboard/admin/emails');
    await expect(page.getByRole('heading', { name: 'E-mails transactionnels' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    await page.getByLabel('Destinataire').fill(recipient);
    const response = page.waitForResponse(
      (item) =>
        item.url().includes('/api/v1/admin/emails/test') && item.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Envoyer le test' }).click();
    const posted = await response;
    expect(posted.ok()).toBe(true);
    await expect(page.getByText('E-mail de test envoye.')).toBeVisible();

    await expect
      .poll(
        async () => {
          const messages = await request.get(`${MAILPIT}/api/v1/messages`);
          if (!messages.ok()) {
            return '';
          }
          const body = (await messages.json()) as {
            messages?: { To?: { Address?: string }[] | string }[];
          };
          for (const message of body.messages ?? []) {
            const recipients = Array.isArray(message.To)
              ? message.To.map((item) => item.Address)
              : [message.To];
            if (recipients.includes(recipient)) {
              return recipient;
            }
          }
          return '';
        },
        { timeout: 30_000, intervals: [500, 1_000, 2_000] },
      )
      .toBe(recipient);
    await logout(page);
  });

  test('panneau lateral accessible sans formulaire sous le tableau', async ({ page }) => {
    await loginAs(page, 'admin.dsi');
    await page.goto('/dashboard/admin/utilisateurs');
    await expect(page.getByRole('heading', { name: 'Utilisateurs' })).toBeVisible();
    await page.getByRole('button', { name: 'Nouvel utilisateur' }).click();
    const panel = page.getByRole('dialog', { name: 'Nouvel utilisateur' });
    await expect(panel).toBeVisible();
    await expect(panel.getByLabel('Prenom', { exact: true })).toBeFocused();
    await expect(panel.locator('form')).toHaveCount(1);
    await expect(page.locator('table + .users-form')).toHaveCount(0);

    await panel.getByLabel('Prenom', { exact: true }).fill('Test panneau');
    await page.keyboard.press('Escape');
    const confirmation = page.getByRole('dialog', { name: 'Modifications non enregistrees' });
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole('button', { name: 'Continuer la saisie' }).click();
    await expect(panel).toBeVisible();
    await panel.getByRole('button', { name: 'Fermer le panneau' }).click();
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole('button', { name: 'Fermer sans enregistrer' }).click();
    await expect(panel).toBeHidden();
    await logout(page);
  });

  test('horloge vivante Abidjan et compteur actualise', async ({ page }) => {
    await loginAs(page, 'admin.dsi');
    await page.goto('/dashboard');
    const clock = page.getByTestId('dashboard-live-clock');
    const counter = page.getByTestId('dashboard-refresh-counter');
    await expect(clock).toContainText(/vendredi|samedi|dimanche|lundi|mardi|mercredi|jeudi/i);
    await expect(clock).toContainText(/\d{2}:\d{2}/);
    await expect(clock).toHaveAttribute('aria-live', 'off');
    const first = await counter.innerText();
    await page.waitForTimeout(2_000);
    const second = await counter.innerText();
    expect(second).not.toBe(first);
    await page.getByRole('button', { name: 'Actualiser' }).click();
    await expect(counter).toContainText(/il y a [01] s/);
    await logout(page);
  });

  test('audit sans identifiant technique visible', async ({ page }) => {
    await loginAs(page, 'auditeur');
    await page.goto('/dashboard/audit');
    await expect(page.locator('table.audit-table tbody tr').first()).toBeVisible();
    const visibleTable = await page.locator('table.audit-table').first().innerText();
    expect(visibleTable).not.toMatch(/[a-f0-9]{24}/);
    await page.getByRole('button', { name: 'Voir' }).first().click();
    const panel = page.getByRole('dialog', { name: "Detail de l'evenement" });
    await expect(panel).toBeVisible();
    await expect(panel.getByText('Informations techniques')).toHaveCount(0);
    const visibleDetail = await panel.locator('dl.audit-detail').first().innerText();
    expect(visibleDetail).not.toMatch(/[a-f0-9]{24}/);
    await panel.getByRole('button', { name: 'Fermer le panneau' }).click();
    await logout(page);
  });

  test('logo DGI officiel et absence de debordement 360', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(
      page.getByRole('img', { name: "Direction Générale des Impôts de Côte d'Ivoire" }).first(),
    ).toBeVisible();
    await loginAs(page, 'admin.dsi');
    await expect(
      page.getByRole('img', { name: "Direction Générale des Impôts de Côte d'Ivoire" }).first(),
    ).toBeVisible();
    await page.goto('/dashboard/admin/utilisateurs');
    await page.setViewportSize({ width: 360, height: 800 });
    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    );
    expect(noOverflow).toBe(true);
    await logout(page);
    await page.goto('/suivi');
    await expect(
      page.getByRole('img', { name: "Direction Générale des Impôts de Côte d'Ivoire" }).first(),
    ).toBeVisible();
  });
  test('axe 0 sur les pages representatives', async ({ page }) => {
    await loginAs(page, 'admin.dsi');
    const pages = [
      '/dashboard',
      '/dashboard/admin/utilisateurs',
      '/dashboard/courriers',
      '/dashboard/contribuables',
      '/dashboard/audit',
    ];
    for (const path of pages) {
      await page.goto(path);
      await expect(page.locator('.theme-toggle')).toHaveAttribute('aria-label', /\S/);
      await expect(page.locator('.notification-center__button')).toHaveAttribute(
        'aria-label',
        /\S/,
      );
      await expect(page.locator('button[aria-controls="app-sidebar"]')).toHaveAttribute(
        'aria-label',
        /\S/,
      );
      for (const width of [1280, 360]) {
        await page.setViewportSize({ width, height: width === 360 ? 800 : 900 });
        const audit = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        expect(audit.violations, `${path} ${width}px`).toEqual([]);
      }
    }
    await logout(page);
  });

  test('fichier EICAR refuse par le vrai ClamAV', async ({ request }) => {
    const token = await apiLogin(
      request,
      'chef.ctf',
      passwordFor(credentials, 'chef.ctf'),
      mfaSecretFor(credentials, 'chef.ctf'),
    );
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
    const token = await apiLogin(
      request,
      'agent.gudef',
      passwordFor(credentials, 'agent.gudef'),
      mfaSecretFor(credentials, 'agent.gudef'),
    );
    const courrier = await createCourrier(request, token, '1234567A', 'favorable');
    const demandeId = await createDemande(request, token, '1234567A', courrier.id, 'favorable');
    favorableDossierNumber = await getDemandeNumero(request, token, demandeId);

    await attribuerGudef(page, favorableDossierNumber);
    const collabToken = await apiLogin(
      request,
      'collab.gudef',
      passwordFor(credentials, 'collab.gudef'),
      mfaSecretFor(credentials, 'collab.gudef'),
    );
    const forbidden = await request.post(`${API}/demandes/${demandeId}/verification-gudef`, {
      headers: authHeaders(collabToken),
    });
    expect(forbidden.status()).toBe(403);
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
    const token = await apiLogin(
      request,
      'agent.gudef',
      passwordFor(credentials, 'agent.gudef'),
      mfaSecretFor(credentials, 'agent.gudef'),
    );
    const courrier = await createCourrier(request, token, '7654321B', 'nonfavorable');
    const demandeId = await createDemande(request, token, '7654321B', courrier.id, 'nonfavorable');
    const numero = await getDemandeNumero(request, token, demandeId);

    await attribuerGudef(page, numero);
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

  test('parcours auditeur complet', async ({ page, request }) => {
    let dossierNumber = favorableDossierNumber;
    if (!dossierNumber) {
      const token = await apiLogin(
        request,
        'admin.dsi',
        passwordFor(credentials, 'admin.dsi'),
        mfaSecretFor(credentials, 'admin.dsi'),
      );
      const events = await apiData<{ items: { targetId: string | null }[] }>(
        request,
        token,
        'get',
        '/audit/events?eventCode=DEMANDE.DEPOSEE&limit=1',
      );
      const demandeId = events.items[0]?.targetId;
      expect(demandeId).toBeTruthy();
      dossierNumber = await getDemandeNumero(request, token, demandeId!);
    }

    await loginAs(page, 'auditeur');
    await page.goto('/dashboard/audit');
    await expect(page.getByRole('heading', { name: "Journal d'audit" })).toBeVisible();
    await page.getByLabel('Dossier', { exact: true }).fill(dossierNumber);
    await page.getByRole('button', { name: 'Appliquer' }).click();
    await expect(page.locator('table.audit-table tbody tr').first()).toBeVisible();

    await page.getByRole('button', { name: 'Chronologie du dossier' }).click();
    const chronology = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Chronologie du dossier' }) });
    await expect(chronology.locator('li').first()).toBeVisible();
    await chronology.getByRole('button', { name: 'Detail' }).first().click();
    await expect(page.getByRole('heading', { name: "Detail de l'evenement" })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Avant / apres' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: "Detail de l'evenement" })).toBeHidden();
    await page.getByRole('button', { name: "Verifier l'integrite" }).click();
    await expect(page.getByText(/0 invalide/)).toBeVisible();

    const downloadPromise = page.waitForEvent('download', { timeout: 90_000 });
    await page.getByRole('button', { name: 'Exporter Excel' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/audit.*\.xlsx$/i);

    await page.getByLabel('Dossier', { exact: true }).fill('');
    await page.getByLabel('Evenement', { exact: true }).selectOption('AUDIT.CONSULTE');
    await page.getByRole('button', { name: 'Appliquer' }).click();
    await expect(
      page.locator('table.audit-table tbody tr').filter({ hasText: 'AUDIT.CONSULTE' }).first(),
    ).toBeVisible();
    await logout(page);

    const decideurToken = await apiLogin(
      request,
      'decideur.dvfn',
      passwordFor(credentials, 'decideur.dvfn'),
      mfaSecretFor(credentials, 'decideur.dvfn'),
    );
    const forbidden = await request.get(`${API}/audit/events`, {
      headers: authHeaders(decideurToken),
    });
    expect(forbidden.status()).toBe(403);
  });

  test('parcours rejet automatique', async ({ page, request }) => {
    const token = await apiLogin(
      request,
      'agent.gudef',
      passwordFor(credentials, 'agent.gudef'),
      mfaSecretFor(credentials, 'agent.gudef'),
    );
    const courrier = await createCourrier(request, token, '1111111C', 'auto');
    await createDemande(request, token, '1111111C', courrier.id, 'auto');

    await waitForPublicStatus(request, '1111111C', 'imprimerie@example.test', 'REJETEE');
    await verifierStatutPublic(page, '1111111C', 'imprimerie@example.test', 'REJETEE');
  });

  test('parcours rejet par agent puis reprise cycle 2', async ({ page, request }) => {
    const token = await apiLogin(
      request,
      'agent.gudef',
      passwordFor(credentials, 'agent.gudef'),
      mfaSecretFor(credentials, 'agent.gudef'),
    );
    const courrier = await createCourrier(request, token, '1234567A', 'reprise');
    const demandeId = await createDemande(request, token, '1234567A', courrier.id, 'reprise');
    const numero = await getDemandeNumero(request, token, demandeId);
    await attribuerGudef(page, numero);
    const collabToken = await apiLogin(
      request,
      'collab.gudef',
      passwordFor(credentials, 'collab.gudef'),
      mfaSecretFor(credentials, 'collab.gudef'),
    );
    const forbiddenRejet = await request.post(`${API}/demandes/${demandeId}/rejets`, {
      headers: authHeaders(collabToken),
      data: {
        motifCode: 'PIECE_JUSTIFICATIVE_MANQUANTE',
        commentaire: 'Tentative de rejet non autorisee.',
      },
    });
    expect(forbiddenRejet.status()).toBe(403);
    const rejetId = await rejeterParAgent(page, demandeId);

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

  test('parcours MFA complet', async ({ page, request, browser }) => {
    const suffix = Date.now().toString().slice(-8);
    const matricule = `agent.dvfn.${suffix}`;
    const email = `${matricule}@test.ci`;
    const password = 'New-Password-2026!';

    await loginAs(page, 'admin.dsi');
    await page.goto('/dashboard/admin/utilisateurs');
    await page.getByRole('button', { name: 'Nouvel utilisateur' }).click();
    const form = page.getByRole('dialog', { name: 'Nouvel utilisateur' });
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
    const recoveryCodes = await enrollNewUser(userPage);
    const navigation = userPage.getByRole('navigation', { name: 'Navigation principale' });
    await expect(navigation.getByRole('link')).toHaveCount(1);
    await expect(navigation.getByRole('link', { name: /Avis.*rendre/i })).toBeVisible();
    await logout(userPage);

    await loginWithPassword(userPage, matricule, password);
    await userPage.locator('#mfa-code').fill('000000');
    await userPage.getByRole('button', { name: 'Verifier' }).click();
    await expect(userPage.getByRole('alert')).toBeVisible();
    await userPage.locator('#mfa-code').fill(recoveryCodes[0]);
    await userPage.getByRole('button', { name: 'Verifier' }).click();
    await expect(userPage).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await logout(userPage);

    await loginWithPassword(userPage, matricule, password);
    await userPage.locator('#mfa-code').fill(recoveryCodes[0]);
    await userPage.getByRole('button', { name: 'Verifier' }).click();
    await expect(userPage.getByRole('alert')).toBeVisible();
    await userPage.locator('#mfa-code').fill(recoveryCodes[1]);
    await userPage.getByRole('button', { name: 'Verifier' }).click();
    await expect(userPage).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await logout(userPage);

    await loginAs(page, 'admin.dsi');
    await page.goto('/dashboard/admin/utilisateurs');
    await page.getByLabel('Recherche').fill(matricule);
    await page.getByRole('button', { name: 'Filtrer' }).click();
    const row = page.locator('tr').filter({ hasText: matricule }).first();
    await expect(row).toBeVisible();
    await row.locator('summary').click();
    await row.getByRole('button', { name: 'Reinitialiser la double authentification' }).click();
    const resetDialog = page.getByRole('dialog');
    await expect(resetDialog).toBeVisible();
    await resetDialog.getByLabel('Motif obligatoire').fill('Telephone perdu');
    const resetMfa = page.waitForResponse(
      (item) => item.url().includes('/mfa/reset') && item.request().method() === 'POST',
    );
    await resetDialog.getByRole('button', { name: 'Reinitialiser' }).click();
    expect((await resetMfa).ok()).toBe(true);

    await userContext.clearCookies();
    await loginWithPassword(userPage, matricule, password);
    await expect(userPage).toHaveURL(/\/auth\/mfa\/enrollment/, { timeout: 30_000 });
    await enrollNewUser(userPage);
    page.once('dialog', (dialog) => dialog.accept());
    await row.locator('summary').click();
    const deactivated = page.waitForResponse(
      (item) => item.url().includes('/deactivate') && item.request().method() === 'POST',
    );
    await row.getByRole('button', { name: 'Desactiver' }).click();
    expect((await deactivated).ok()).toBe(true);

    await userPage.goto('/dashboard/suivis');
    await expect(userPage).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
    await userContext.close();
  });

  test('parcours adhesion contribuable complet', async ({ page, request, browser }) => {
    const suffix = Date.now().toString().slice(-8);
    const email = `adhesion.${suffix}@example.test`;
    const password = 'Adhesion-2026!Aaa';
    const token = await apiLogin(
      request,
      'agent.gudef',
      passwordFor(credentials, 'agent.gudef'),
      mfaSecretFor(credentials, 'agent.gudef'),
    );
    const existingAccounts = await request.get(`${API}/adhesions/comptes?search=7654321B`, {
      headers: authHeaders(token),
    });
    const accountsBody = (await existingAccounts.json()) as {
      data?: { userId: string; isActive: boolean }[];
    };
    for (const account of accountsBody.data ?? []) {
      if (account.isActive) {
        const disabled = await request.post(
          `${API}/adhesions/comptes/${account.userId}/desactiver`,
          {
            headers: authHeaders(token),
            data: { motif: 'Recette L22 - remplacement du compte' },
          },
        );
        expect(disabled.ok()).toBe(true);
      }
    }

    const courrier = await createCourrier(request, token, '7654321B', `l22-${suffix}`);
    const demandeId = await createDemande(request, token, '7654321B', courrier.id, `l22-${suffix}`);
    const numero = await getDemandeNumero(request, token, demandeId);
    await attribuerGudef(page, numero);
    await verifierGudef(page, demandeId);
    await emettreAvis(page, 'decideur.dvfn', demandeId, 'NON_FAVORABLE');
    await emettreAvis(page, 'decideur.derar', demandeId);
    await emettreAvis(page, 'directeur.dme', demandeId);

    await loginAs(page, 'dg');
    await page.goto('/dashboard/courriers/a-signer');
    await page.getByRole('link', { name: 'Deposer le PDF signe' }).first().click();
    await page.waitForURL(/\/dashboard\/courriers\/[a-f0-9]{24}/);
    const signatureSection = page
      .locator('section.pd-card')
      .filter({ hasText: 'Deposer le courrier signe' });
    await signatureSection.getByLabel('Signataire declare').fill('Directeur General');
    const signature = page.waitForResponse(
      (item) => item.url().includes('/signature') && item.request().method() === 'POST',
    );
    await signatureSection.locator('input[type="file"]').setInputFiles({
      name: 'signe-l22.pdf',
      mimeType: 'application/pdf',
      buffer: pdfBuffer('Courrier signe L22'),
    });
    expect((await signature).ok()).toBe(true);
    await logout(page);

    await page.goto('/adhesion');
    await expect(
      page.getByRole('heading', { name: "Demande d'adhesion contribuable" }),
    ).toBeVisible();
    await page.getByLabel('NCC', { exact: true }).fill('7654321B');
    await page.getByLabel('Nom', { exact: true }).fill('Diallo');
    await page.getByLabel('Prenom', { exact: true }).fill('Awa');
    await page.getByLabel('Fonction', { exact: true }).fill('Gerante');
    await page.getByLabel('E-mail', { exact: true }).fill(email);
    await page.getByLabel('Telephone', { exact: true }).fill('+2250700000022');
    await page.getByRole('button', { name: 'Envoyer la demande' }).click();
    await expect(page.getByText('Verifiez votre boite e-mail')).toBeVisible();

    const adhesionLink = await waitForMailpitLink(
      request,
      email,
      /http:\/\/localhost:4200\/adhesion\?token=[^"<\s]+/,
    );
    await page.goto(adhesionLink);
    await expect(page.getByRole('heading', { name: 'Pieces a joindre' })).toBeVisible();
    await page.getByLabel(/Autorisation sign/).setInputFiles({
      name: 'autorisation.pdf',
      mimeType: 'application/pdf',
      buffer: pdfBuffer('Autorisation L22'),
    });
    await expect(page.getByText(/Fichier recu : autorisation.pdf/)).toBeVisible();
    await page.getByLabel(/Pièce d'identité/).setInputFiles({
      name: 'identite.pdf',
      mimeType: 'application/pdf',
      buffer: pdfBuffer('Identite L22'),
    });
    const submitAdhesion = page.getByRole('button', { name: 'Soumettre ma demande' });
    await expect(submitAdhesion).toBeEnabled();
    await submitAdhesion.click();
    await expect(page.getByText('Demande transmise')).toBeVisible();

    await loginAs(page, 'agent.gudef');
    await page.goto('/dashboard/adhesions');
    const toolbar = page.locator('.adhesions-toolbar');
    await toolbar.getByLabel('Statut').selectOption('EN_ATTENTE_VALIDATION');
    await toolbar.getByLabel('Recherche').fill('7654321B');
    await toolbar.getByRole('button', { name: 'Filtrer' }).click();
    const adhesionRow = page
      .locator('.adhesions-list tbody tr')
      .filter({ hasText: '7654321B' })
      .filter({ hasText: 'En attente de validation' })
      .first();
    await expect(adhesionRow).toBeVisible();
    await adhesionRow.click();
    await expect(page.getByRole('heading', { name: 'Detail de la demande' })).toBeVisible();
    const accept = page.waitForResponse(
      (item) => item.url().includes('/accepter') && item.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Accepter' }).click();
    expect((await accept).ok()).toBe(true);
    await logout(page);

    const adminToken = await apiLogin(
      request,
      'admin.dsi',
      passwordFor(credentials, 'admin.dsi'),
      mfaSecretFor(credentials, 'admin.dsi'),
    );
    const forbidden = await request.get(`${API}/adhesions`, {
      headers: authHeaders(adminToken),
    });
    expect(forbidden.status()).toBe(403);

    const invitation = await waitForMailpitLink(
      request,
      email,
      /http:\/\/localhost:4200\/auth\/reset-password\?token=[^"<\s]+/,
    );
    const userContext = await browser.newContext({ baseURL: 'http://localhost:4200' });
    const userPage = await userContext.newPage();
    await userPage.goto(invitation);
    await userPage.getByLabel('Nouveau mot de passe', { exact: true }).fill(password);
    await userPage.getByLabel('Confirmer le mot de passe', { exact: true }).fill(password);
    const reset = userPage.waitForResponse(
      (item) =>
        item.url().includes('/api/v1/auth/reset-password') && item.request().method() === 'POST',
    );
    await userPage.getByRole('button', { name: 'Reinitialiser' }).click();
    expect((await reset).ok()).toBe(true);
    await loginWithPassword(userPage, email, password);
    await userPage.goto('/espace');
    await expect(userPage.getByRole('heading', { name: 'Mes dossiers' })).toBeVisible();
    await expect(userPage.getByRole('link', { name: numero })).toBeVisible();
    await userPage.getByRole('link', { name: numero }).click();
    await expect(userPage.getByRole('heading', { name: `Dossier ${numero}` })).toBeVisible();
    const download = userPage.waitForEvent('download', { timeout: 30_000 });
    await userPage.getByRole('button', { name: 'Telecharger le courrier de reponse' }).click();
    const fichier = await download;
    expect(fichier.suggestedFilename()).toMatch(/courrier.*\.pdf$/i);
    await userPage.goto('/espace/dossiers/0123456789abcdef01234567');
    await expect(userPage.getByRole('heading', { name: 'Dossier introuvable' })).toBeVisible();

    await loginAs(page, 'agent.gudef');
    await page.goto('/dashboard/adhesions');
    const accountsSearch = page.locator('.adhesions-accounts__head');
    await accountsSearch.getByLabel('Recherche').fill(email);
    await accountsSearch.getByRole('button', { name: 'Filtrer' }).click();
    const accountRow = page.locator('tr').filter({ hasText: email }).first();
    await expect(accountRow).toBeVisible();
    await accountRow.getByRole('button', { name: 'Desactiver' }).click();
    const motifDialog = page.getByRole('dialog');
    await motifDialog.getByLabel('Motif obligatoire').fill('Retrait du mandat');
    const deactivation = page.waitForResponse(
      (item) => item.url().includes('/desactiver') && item.request().method() === 'POST',
    );
    await motifDialog.getByRole('button', { name: 'Desactiver' }).click();
    expect((await deactivation).ok()).toBe(true);
    await userPage.goto('/espace');
    await expect(userPage).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
    await userContext.close();
  });
  test('parcours depot en ligne enrichi', async ({ page, request, browser }) => {
    const ncc = '9' + Date.now().toString().slice(-6) + 'Z';
    const email = `depot.${Date.now()}@example.test`;
    const password = 'Depot-2026!Aaa';
    await creerCompteContribuable(request, ncc, email, password);

    await loginWithPassword(page, email, password);
    await page.goto('/espace');
    await page.getByRole('link', { name: 'Nouveau depot' }).first().click();
    await expect(page.getByRole('heading', { name: /Identification et exercices/ })).toBeVisible();
    await page.locator('.depot-choice input').first().check();
    await expect(page).toHaveURL(/\/espace\/depots\/[a-f0-9]{24}/, { timeout: 15_000 });
    await page.getByRole('button', { name: 'Etape suivante' }).click();
    await expect(page.getByRole('heading', { name: /Etats financiers/ })).toBeVisible();
    await page.getByLabel('Toute la liasse').first().check();
    await page.waitForTimeout(2500);

    await expect(page).toHaveURL(/\/espace\/depots\/[a-f0-9]{24}/, { timeout: 15_000 });
    expect(
      await page.evaluate(() => ({
        local: localStorage.length,
        session: sessionStorage.length,
      })),
    ).toEqual({ local: 0, session: 0 });
    const draftUrl = page.url();
    await page.close();

    const resumed = await browser.newContext({ baseURL: 'http://localhost:4200' });
    const resumedPage = await resumed.newPage();
    await loginWithPassword(resumedPage, email, password);
    await resumedPage.goto('/espace');
    const draft = resumedPage.locator('.espace-drafts li').filter({ hasText: 'Exercice' }).first();
    await expect(draft).toBeVisible();
    await draft.getByRole('link', { name: 'Reprendre' }).click();
    await expect(resumedPage.getByRole('heading', { name: /Etats financiers/ })).toBeVisible();
    await expect(resumedPage.getByLabel('Toute la liasse').first()).toBeChecked();

    await resumedPage.getByRole('button', { name: 'Etape suivante' }).click();
    await expect(resumedPage.getByRole('heading', { name: /Motifs/ })).toBeVisible();
    await expect(resumedPage.locator('.depot-save')).toContainText('Enregistre a', {
      timeout: 20_000,
    });
    const motif = resumedPage.getByRole('checkbox', { name: 'Erreur de saisie' });
    const savedMotifs = resumedPage.waitForResponse(
      (item) =>
        item.url().includes('/espace/depots/brouillons/') && item.request().method() === 'PUT',
      { timeout: 20_000 },
    );
    await motif.click();
    await savedMotifs;
    await expect(motif).toBeChecked();
    await resumedPage.getByRole('button', { name: 'Etape suivante' }).click();
    await expect(resumedPage.getByRole('heading', { name: /Variables/ })).toBeVisible();
    await resumedPage.getByRole('button', { name: 'Etape suivante' }).click();
    await expect(
      resumedPage.getByRole('heading', { name: /Pieces et recapitulatif/ }),
    ).toBeVisible();

    const draftId = new URL(resumedPage.url()).pathname.split('/').pop();
    const contribuableToken = await apiLogin(request, email, password, '');
    const upload = await request.post(`${API}/espace/depots/brouillons/${draftId}/pieces`, {
      headers: authHeaders(contribuableToken),
      multipart: {
        file: {
          name: 'depot.pdf',
          mimeType: 'application/pdf',
          buffer: pdfBuffer('Depot en ligne'),
        },
      },
    });
    expect(upload.ok(), await upload.text()).toBe(true);
    await resumedPage.reload();
    await expect(
      resumedPage.getByRole('heading', { name: /Pieces et recapitulatif/ }),
    ).toBeVisible();
    await expect(resumedPage.getByText('depot.pdf')).toBeVisible();
    const deposit = resumedPage.waitForResponse(
      (item) => item.url().includes('/deposer') && item.request().method() === 'POST',
    );
    await resumedPage.getByRole('button', { name: 'Deposer la demande' }).click();
    expect((await deposit).ok()).toBe(true);
    await expect(resumedPage.getByRole('heading', { name: 'Demande deposee' })).toBeVisible();
    const numero = (await resumedPage.locator('.depot-confirmation__numero').innerText()).replace(
      /^Numero\s+/,
      '',
    );
    expect(numero).toMatch(/^\d{4}-\d{4}$/);

    await resumedPage.goto('/espace');
    await expect(resumedPage.getByRole('link', { name: numero })).toBeVisible();

    const agentToken = await apiLogin(
      request,
      'agent.gudef',
      passwordFor(credentials, 'agent.gudef'),
      mfaSecretFor(credentials, 'agent.gudef'),
    );
    const queue = await apiData<{ items: { numero: string | null }[] }>(
      request,
      agentToken,
      'get',
      `/demandes?search=${encodeURIComponent(numero)}`,
    );
    expect(queue.items.some((item) => item.numero === numero)).toBe(true);
    await resumed.close();
  });

  test('parcours pilotage avance L25', async ({ page, request }) => {
    const suffix = Date.now().toString().slice(-6);
    const token = await apiLogin(
      request,
      'agent.gudef',
      passwordFor(credentials, 'agent.gudef'),
      mfaSecretFor(credentials, 'agent.gudef'),
    );
    const courrier = await createCourrier(request, token, '1234567A', `l25-${suffix}`);
    const demandeId = await createDemande(request, token, '1234567A', courrier.id, `l25-${suffix}`);
    const numero = await getDemandeNumero(request, token, demandeId);
    await attribuerGudef(page, numero);
    const collabToken = await apiLogin(
      request,
      'collab.gudef',
      passwordFor(credentials, 'collab.gudef'),
      mfaSecretFor(credentials, 'collab.gudef'),
    );
    const forbiddenAttribution = await request.post(`${API}/imputations/${demandeId}/attribuer`, {
      headers: authHeaders(collabToken),
      data: { userId: '' },
    });
    expect(forbiddenAttribution.status()).toBe(403);

    await loginAs(page, 'agent.gudef');
    await page.getByRole('button', { name: /Notifications/ }).click();
    const notification = page.getByText('Dossier attribue').first();
    await expect(notification).toBeVisible({ timeout: 30_000 });
    const notificationItem = page
      .locator('li.notification-item')
      .filter({ has: page.locator(`a[href="/dashboard/demandes/${demandeId}"]`) })
      .first();
    await expect(notificationItem).toBeVisible({ timeout: 30_000 });
    await notificationItem.locator('button[aria-label^="Marquer comme lu"]').click();
    await notificationItem.getByRole('link', { name: 'Ouvrir le dossier' }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/demandes/${demandeId}`), {
      timeout: 15_000,
    });
    await logout(page);

    await loginAs(page, 'sd.gudef');
    await page.goto('/dashboard');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const transitionProperty = await page
      .locator('.bar-chart__bar rect')
      .first()
      .evaluate((element) => getComputedStyle(element).transitionProperty);
    expect(transitionProperty).toBe('none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const assertNoPiiInUrl = (url: string): void => {
      const current = new URL(url);
      const target = decodeURIComponent(current.pathname + current.search);
      expect(target).not.toContain('1234567A');
      expect(target).not.toContain('Boulangerie');
      expect(target).not.toContain('@');
    };
    assertNoPiiInUrl(page.url());
    const lateCard = page.locator('a.kpi-link').filter({ hasText: 'En retard' });
    const periode = await page.getByLabel('Periode').inputValue();
    let lateCount = 0;
    await expect
      .poll(
        async () => {
          const parsed = Number((await lateCard.locator('strong').innerText()).trim());
          if (Number.isFinite(parsed)) {
            lateCount = parsed;
          }
          return Number.isFinite(parsed);
        },
        { timeout: 15_000 },
      )
      .toBe(true);
    await lateCard.click();
    assertNoPiiInUrl(page.url());
    await expect(page.getByRole('button', { name: 'Retour au graphique' })).toBeVisible();
    const listed = Number((await page.locator('.actions .pd-muted').innerText()).split(' ')[0]);
    expect(listed).toBe(lateCount);
    await page.getByRole('button', { name: 'Retour au graphique' }).click();
    await expect(page.getByLabel('Periode')).toHaveValue(periode);
    await logout(page);

    await loginAs(page, 'sd.gudef');
    await page.goto('/dashboard/pilotage/charge');
    assertNoPiiInUrl(page.url());
    await expect(page.getByRole('link', { name: 'M. Yao' })).toBeVisible();
    await logout(page);

    await loginAs(page, 'directeur.dme');
    await page.goto('/dashboard/pilotage/charge');
    await expect(page.getByText('DERAR', { exact: true })).toHaveCount(0);
    await logout(page);
  });

  test('parcours pieces apres rejet L24', async ({ page, request }) => {
    const suffix = Date.now().toString().slice(-6);
    const ncc = '8' + suffix + 'Z';
    const email = `pieces.${Date.now()}@example.test`;
    const password = 'Pieces-2026!Aaa';
    await creerCompteContribuable(request, ncc, email, password);

    const agentToken = await apiLogin(
      request,
      'agent.gudef',
      passwordFor(credentials, 'agent.gudef'),
      mfaSecretFor(credentials, 'agent.gudef'),
    );
    const courrier = await createCourrier(request, agentToken, ncc, `l24-${suffix}`);
    const demandeId = await createDemande(request, agentToken, ncc, courrier.id, `l24-${suffix}`);
    const numero = await getDemandeNumero(request, agentToken, demandeId);
    await attribuerGudef(page, numero);
    const rejetId = await rejeterParAgent(page, demandeId);

    const contribuableToken = await apiLogin(request, email, password, '');
    const eicar = await request.post(`${API}/espace/dossiers/${demandeId}/pieces-demandees`, {
      headers: authHeaders(contribuableToken),
      multipart: {
        files: {
          name: 'eicar.pdf',
          mimeType: 'application/pdf',
          buffer: eicarPdfBuffer(),
        },
      },
    });
    expect(eicar.ok()).toBe(false);

    await loginWithPassword(page, email, password);
    await page.goto(`/espace/dossiers/${demandeId}`);
    await expect(page.getByRole('heading', { name: 'Pieces demandees' })).toBeVisible();
    const espaceUrl = decodeURIComponent(new URL(page.url()).pathname + new URL(page.url()).search);
    expect(espaceUrl).not.toContain(ncc);
    expect(espaceUrl).not.toContain(email);
    expect(espaceUrl).not.toContain('Boulangerie');
    for (const viewport of [
      { width: 360, height: 800 },
      { width: 768, height: 1024 },
      { width: 1280, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      const audit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(audit.violations, `axe ${viewport.width}px`).toEqual([]);
      const noOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      );
      expect(noOverflow, `overflow ${viewport.width}px`).toBe(true);
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page
      .locator('input[type="file"]')
      .setInputFiles({ name: 'preuve.pdf', mimeType: 'application/pdf', buffer: pdfBuffer('L24') });
    await page.getByLabel('Message (facultatif)').fill('Piece transmise pour correction.');
    const envoi = page.waitForResponse(
      (item) =>
        item.url().includes(`/espace/dossiers/${demandeId}/pieces-demandees`) &&
        item.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Envoyer les pieces' }).click();
    expect((await envoi).ok()).toBe(true);
    await expect(page.getByText('preuve.pdf')).toBeVisible();
    await logout(page);

    await loginAs(page, 'agent.gudef');
    await page.goto('/dashboard/rejets');
    const row = page.locator('tr').filter({ hasText: numero }).first();
    await expect(row).toBeVisible();
    await expect(row.getByText('Pièces reçues')).toBeVisible();
    await row.getByRole('link', { name: numero }).click();
    await expect(page.getByRole('heading', { name: 'Pièces reçues' })).toBeVisible();
    await expect(page.getByText('preuve.pdf')).toBeVisible();
    await logout(page);

    await apiData(request, agentToken, 'post', `/rejets/${rejetId}/reprendre`, {});
    const afterReprise = await request.get(`${API}/espace/dossiers/${demandeId}/pieces-demandees`, {
      headers: authHeaders(contribuableToken),
    });
    expect(afterReprise.status()).toBe(404);
  });
});

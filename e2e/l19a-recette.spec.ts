import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const profiles: Record<string, { roles: string[]; displayName: string }> = {
  'admin.dsi': { roles: ['ADMINISTRATEUR_DSI'], displayName: 'Administrateur DSI' },
  'sd.gudef': { roles: ['SD_GUDEF'], displayName: 'Sous-directeur GUDEF' },
  'collab.gudef': { roles: ['COLLABORATEUR_GUDEF'], displayName: 'Collaborateur GUDEF' },
  'agent.gudef': { roles: ['AGENT_GUDEF'], displayName: 'Agent GUDEF' },
  'decideur.derar': { roles: ['DECIDEUR_DERAR'], displayName: 'Decideur DERAR' },
  'decideur.dvfn': { roles: ['DECIDEUR_DVFN'], displayName: 'Decideur DVFN' },
  'directeur.dme': { roles: ['DIRECTEUR_RATTACHEMENT'], displayName: 'Directeur DME' },
  dg: { roles: ['DG'], displayName: 'Directeur General' },
  'chef.ctf': { roles: ['CHEF_CTF'], displayName: 'Chef CTF' },
  'collab.ctf': { roles: ['COLLABORATEUR_CTF'], displayName: 'Collaborateur CTF' },
  'superviseur.dsesf': { roles: ['SUPERVISEUR_DSESF'], displayName: 'Superviseur DSESF' },
  auditeur: { roles: ['AUDITEUR'], displayName: 'Auditeur' },
};

const permissions = [
  'Courriers_Read',
  'Courriers_Create',
  'Courriers_Update',
  'Courriers_DeposerSigne',
  'Demandes_Read',
  'Demandes_Create',
  'Suivis_Read',
  'Suivis_Decide',
  'Suivis_Corriger',
  'Suivis_Transmettre',
  'Avis_Emettre',
  'Ctf_Read',
  'Ctf_Activer',
  'Ctf_Retour',
  'Rejets_Read',
  'Rejets_Reprendre',
  'Rejets_Abandonner',
  'Rapports_Read',
  'Alertes_Read',
  'Files_Read',
  'Files_Create',
];

const suivi = {
  id: 's1',
  demandeId: 'd1',
  numero: '2026-0001',
  cycle: 1,
  contribuable: { ncc: '1234567A', raisonSociale: 'Boulangerie du Plateau' },
  statut: 'EN_CIRCUIT',
  avisRecus: 0,
  avisTotal: 3,
  avisFavorables: 0,
  avisNonFavorables: 0,
  transmissionsCount: 0,
  etapeCourante: 'AVIS_DVFN',
  demandeStatut: 'EN_CIRCUIT',
  dateDepot: '2026-11-01T00:00:00Z',
  dateOuverture: '2026-11-01T00:00:00Z',
  dateCloture: null,
  avis: [
    {
      id: 'a1',
      etapeCode: 'AVIS_DVFN',
      directionId: 'DVFN',
      directionCode: 'DVFN',
      statut: 'EN_ATTENTE',
      decision: null,
      motifCode: null,
      commentaire: null,
      emisLe: null,
      emisPar: null,
      echeance: null,
    },
    {
      id: 'a2',
      etapeCode: 'AVIS_DERAR',
      directionId: 'DERAR',
      directionCode: 'DERAR',
      statut: 'EN_ATTENTE',
      decision: null,
      motifCode: null,
      commentaire: null,
      emisLe: null,
      emisPar: null,
      echeance: null,
    },
    {
      id: 'a3',
      etapeCode: 'AVIS_RATTACHEMENT',
      directionId: 'DME',
      directionCode: 'DME',
      statut: 'EN_ATTENTE',
      decision: null,
      motifCode: null,
      commentaire: null,
      emisLe: null,
      emisPar: null,
      echeance: null,
    },
  ],
  validationGlobale: {
    id: 'v1',
    statut: 'EN_ATTENTE',
    decision: null,
    motifCode: null,
    commentaire: null,
    decidePar: null,
    decideLe: null,
    courrierReponseId: 'c1',
    signatureStatut: null,
    depotEImpotsStatut: null,
    referenceDepotEImpots: null,
    clotureLe: null,
  },
  corrections: [],
  transmissions: [],
  directionIds: ['DVFN', 'DERAR', 'DME'],
  etapes: [],
};

const ctf = {
  id: 'ctf1',
  demandeId: 'd1',
  numeroDemande: '2026-0001',
  cycle: 1,
  ncc: '1234567A',
  raisonSociale: 'Boulangerie du Plateau',
  statut: 'A_ACTIVER',
  dateCreation: '2026-11-01T00:00:00Z',
  echeanceActivation: '2026-11-10T00:00:00Z',
  echeanceDepot: '2026-11-30T00:00:00Z',
  joursRestantsActivation: 5,
  joursRestantsDepot: 15,
  motifCloture: null,
  dateCloture: null,
  courrierId: 'c1',
  idempotencyKey: 'c1:1',
  referenceActivation: null as string | null,
  dateActivationDemandee: null as string | null,
  dateActivation: null as string | null,
  dateInformation: null,
  dateRetourGudef: null as string | null,
  dateDepotRectifie: null as string | null,
  referenceDepotRectifie: null,
  modeActivation: null,
  modeDepotRectifie: null,
  tentatives: 0,
  derniereErreur: null,
};

const courrier = {
  id: 'c1',
  sens: 'SORTANT',
  typeCourrier: 'REPONSE_DGI',
  numero: 'C-2026-0001',
  dateArrivee: null,
  dateEmission: '2026-11-01T00:00:00Z',
  references: '2026-0001',
  expediteur: 'GUDEF',
  objet: 'Refus',
  imputation: 'GUDEF',
  estLie: true,
  contribuable: {
    id: 'cb1',
    ncc: null,
    nccMasque: '123****7A',
    raisonSociale: 'Boulangerie du Plateau',
  },
  createdAt: '2026-11-01T00:00:00Z',
  instructionsDirecteur: null,
  annotationsSdGudef: null,
  demandeId: 'd1',
  signatureStatut: 'EN_ATTENTE',
  signatureReference: null,
  signatureLe: null,
  depotEImpotsStatut: null,
  depotEImpotsLe: null,
  referenceDepot: null,
  updatedAt: null,
  version: 1,
};

async function mockApi(page: Page): Promise<{ reprise: () => boolean }> {
  let current = {
    login: 'admin.dsi',
    roles: profiles['admin.dsi'].roles,
    displayName: profiles['admin.dsi'].displayName,
  };
  let repriseCalled = false;
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname !== 'localhost' || url.port !== '5080') {
      await route.continue();
      return;
    }

    const headers = {
      'access-control-allow-origin': 'http://localhost:4200',
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'content-type,x-correlation-id',
      'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
      'content-type': 'application/json',
    };
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }

    const ok = (data: unknown, status = 200) =>
      route.fulfill({ status, headers, body: JSON.stringify({ success: true, data }) });
    const path = url.pathname;

    if (path.endsWith('/auth/login')) {
      const body = JSON.parse(request.postData() ?? '{}') as { login?: string };
      const login = body.login ?? 'admin.dsi';
      current = {
        login,
        roles: profiles[login]?.roles ?? ['AGENT_GUDEF'],
        displayName: profiles[login]?.displayName ?? login,
      };
      await route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: { accessToken: 'e2e', expiresAt: '2030-01-01T00:00:00Z' },
        }),
      });
      return;
    }
    if (path.endsWith('/auth/refresh')) {
      await ok({ accessToken: 'e2e', expiresAt: '2030-01-01T00:00:00Z' });
      return;
    }
    if (path.endsWith('/me')) {
      await ok({
        ...current,
        id: 'u1',
        email: `${current.login}@example.test`,
        directionId: 'DME',
        directionCode: 'DME',
        mustChangePassword: false,
        permissions,
      });
      return;
    }
    if (path.endsWith('/auth/logout')) {
      await route.fulfill({ status: 204, headers });
      return;
    }

    if (path.endsWith('/integrations/modes')) {
      await ok({ eImpots: 'MANUEL', signature: 'MANUEL' });
      return;
    }
    if (path.endsWith('/public/suivi')) {
      const body = JSON.parse(request.postData() ?? '{}') as { ncc?: string };
      const rejected = body.ncc === '1111111C';
      await ok({
        trouve: true,
        message: 'OK',
        dossiers: [
          {
            numero: '2026-0003',
            statut: rejected ? 'REJETEE' : 'CLOTUREE',
            etapes: [],
            decisionFinale: rejected ? null : 'FAVORABLE',
            motifRejet: rejected ? 'Telephone manquant' : null,
          },
        ],
      });
      return;
    }
    if (path.endsWith('/suivis/motifs')) {
      await ok([
        { code: 'PIECE_MANQUANTE', libelle: 'Piece manquante' },
        { code: 'ARTICLE24', libelle: 'Article 24' },
      ]);
      return;
    }
    if (path.endsWith('/suivis') && request.method() === 'GET') {
      await ok({ items: [suivi], page: 1, pageSize: 20, totalCount: 1 });
      return;
    }
    if (path.endsWith('/suivis/d1')) {
      await ok(suivi);
      return;
    }
    if (path.includes('/demandes/d1/avis/') || path.endsWith('/demandes/d1/validation')) {
      await ok(suivi);
      return;
    }
    if (path.endsWith('/demandes/d1/transmissions')) {
      await ok({ id: 't1', destinatairesCount: 1, emisLe: '2026-11-01T00:00:00Z' });
      return;
    }
    if (path.endsWith('/demandes/formulaire')) {
      await ok({
        exercices: [],
        etatsFinanciers: [],
        motifsRectification: [],
        variables: [],
        courriers: [],
      });
      return;
    }
    if (path.endsWith('/ctf/a-activer') || path.endsWith('/ctf/suivi') || path.endsWith('/ctf')) {
      await ok([ctf]);
      return;
    }
    if (path.endsWith('/ctf/d1')) {
      await ok(ctf);
      return;
    }
    if (path.endsWith('/ctf/d1/activation-manuelle')) {
      ctf.statut = 'ACTIVEE';
      ctf.dateActivation = new Date().toISOString();
      await ok(ctf);
      return;
    }
    if (path.endsWith('/ctf/d1/retour-gudef')) {
      ctf.dateRetourGudef = new Date().toISOString();
      await ok(ctf);
      return;
    }
    if (path.endsWith('/ctf/d1/depot-rectifie-manuel')) {
      ctf.dateDepotRectifie = new Date().toISOString();
      ctf.statut = 'CLOTUREE';
      await ok(ctf);
      return;
    }
    if (path.endsWith('/courriers-manuels/a-signer')) {
      await ok([
        {
          courrierId: 'c1',
          numero: 'C-2026-0001',
          objet: 'Refus',
          demandeId: 'd1',
          numeroDemande: '2026-0001',
          raisonSociale: 'Boulangerie du Plateau',
          decisionLe: '2026-11-01T00:00:00Z',
          joursDepuisDecision: 8,
          signatureStatut: 'EN_ATTENTE',
        },
      ]);
      return;
    }
    if (path.endsWith('/courriers/c1')) {
      await ok(courrier);
      return;
    }
    if (path.endsWith('/courriers-manuels/c1/signature')) {
      await ok({ statut: 'SIGNE', sha256: 'abc', versionId: 'fv1', mode: 'MANUEL' });
      return;
    }
    if (path.endsWith('/courriers-manuels/c1/remise')) {
      await ok({});
      return;
    }
    if (path.endsWith('/files/policy')) {
      await ok({
        maximumFiles: 10,
        maximumFileSizeBytes: 5_000_000,
        maximumTotalSizeBytes: 20_000_000,
        minimumPdfCount: 0,
        allowedContentTypes: ['application/pdf', 'image/png', 'image/jpeg'],
      });
      return;
    }
    if (path.endsWith('/files')) {
      await ok({
        id: 'fg1',
        currentVersion: 1,
        currentFile: { id: 'fv1' },
        ownerType: 'CTF',
        ownerId: 'd1',
      });
      return;
    }
    if (path.endsWith('/rejets/motifs')) {
      await ok([{ code: 'PIECE_MANQUANTE', libelle: 'Piece manquante' }]);
      return;
    }
    if (path.endsWith('/rejets/r1/reprendre')) {
      repriseCalled = true;
      await ok({ id: 'r1', statut: 'CORRIGE' });
      return;
    }
    if (path.endsWith('/rejets/r1')) {
      await ok({
        id: 'r1',
        demandeId: 'd1',
        numeroDemande: '2026-0004',
        cycle: 1,
        famille: 'PAR_AGENT',
        motifCode: 'PIECE_MANQUANTE',
        motifLibelle: 'Piece manquante',
        commentaire: null,
        statut: 'EN_ATTENTE_CORRECTION',
        pieceComplementaireRequise: true,
        dateReprise: null,
        dateAbandon: null,
        createdAt: '2026-11-01T00:00:00Z',
      });
      return;
    }
    if (path.endsWith('/rejets')) {
      await ok({
        items: [
          {
            id: 'r1',
            demandeId: 'd1',
            numeroDemande: '2026-0004',
            cycle: 1,
            famille: 'PAR_AGENT',
            motifCode: 'PIECE_MANQUANTE',
            motifLibelle: 'Piece manquante',
            statut: 'EN_ATTENTE_CORRECTION',
            createdAt: '2026-11-01T00:00:00Z',
          },
        ],
        page: 1,
        pageSize: 20,
        totalCount: 1,
      });
      return;
    }

    await ok({});
  });
  return { reprise: () => repriseCalled };
}

async function loginAs(page: Page, login: string): Promise<void> {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Acceder a votre espace' })).toBeVisible();
  await page.getByLabel('Identifiant').fill(login);
  await page.getByLabel('Mot de passe', { exact: true }).fill('Correct-Horse-2026!');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Se deconnecter' }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
}

async function avis(page: Page, login: string, step: string): Promise<void> {
  await loginAs(page, login);
  await page.goto('/dashboard/suivis/d1');
  await expect(page.getByRole('heading', { name: '2026-0001' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Avis des directions' })).toBeVisible();
  await expect(page.getByText(step, { exact: true }).first()).toBeVisible();
  const posted = page.waitForResponse(
    (response) => response.url().includes('/avis/') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: "Emettre l'avis" }).first().click();
  await posted;
}

test.describe('L19a - recette navigateur', () => {
  test('parcours favorable complet en mode manuel', async ({ page }) => {
    await mockApi(page);
    await loginAs(page, 'agent.gudef');
    await page.goto('/dashboard/demandes/nouvelle');
    await expect(page.getByRole('heading', { name: 'Nouvelle demande' })).toBeVisible();
    await logout(page);

    await loginAs(page, 'sd.gudef');
    await page.goto('/dashboard/suivis');
    await expect(page.getByRole('heading', { name: 'Suivis' })).toBeVisible();
    await logout(page);

    await loginAs(page, 'collab.gudef');
    await page.goto('/dashboard/suivis/d1');
    await expect(page.getByRole('heading', { name: 'Avis des directions' })).toBeVisible();
    await logout(page);

    await avis(page, 'decideur.dvfn', 'DVFN');
    await logout(page);
    await avis(page, 'decideur.derar', 'DERAR');
    await logout(page);
    await avis(page, 'directeur.dme', 'DME');
    await logout(page);

    await loginAs(page, 'sd.gudef');
    await page.goto('/dashboard/suivis/d1/validation');
    await expect(page.getByRole('heading', { name: /Validation globale/ })).toBeVisible();
    await page.getByRole('button', { name: 'Valider' }).click();
    await logout(page);

    await loginAs(page, 'chef.ctf');
    await page.goto('/dashboard/ctf/d1');
    await page.getByLabel('Reference e-impots').fill('EIMP-ACT-1');
    await page.getByRole('button', { name: "Declarer l'activation" }).click();
    await expect(page.getByRole('button', { name: 'Retour GUDEF' })).toBeVisible();
    await page.getByRole('button', { name: 'Retour GUDEF' }).click();
    await page.getByLabel('Reference depot rectifie').fill('EIMP-DEP-1');
    await page.getByRole('button', { name: 'Declarer le depot rectifie' }).click();
    await logout(page);

    await page.goto('/suivi');
    await page.getByLabel('NCC').fill('1234567A');
    await page.getByLabel('E-mail').fill('boulangerie@example.test');
    await page.getByRole('button', { name: 'Rechercher' }).click();
    await expect(page.getByText('CLOTUREE')).toBeVisible();
  });

  test('parcours non favorable jusqu a la remise', async ({ page }) => {
    await mockApi(page);
    await loginAs(page, 'decideur.dvfn');
    await page.goto('/dashboard/suivis/d1');
    await page.getByRole('combobox', { name: 'Decision' }).first().selectOption('NON_FAVORABLE');
    await page.getByRole('combobox', { name: 'Motif' }).first().selectOption('PIECE_MANQUANTE');
    const posted = page.waitForResponse(
      (response) => response.url().includes('/avis/') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: "Emettre l'avis" }).first().click();
    await posted;
    await logout(page);

    await loginAs(page, 'sd.gudef');
    await page.goto('/dashboard/suivis/d1/validation');
    await page.getByRole('combobox', { name: 'Decision' }).selectOption('NON_FAVORABLE');
    await page.getByRole('combobox', { name: 'Motif' }).selectOption('PIECE_MANQUANTE');
    await page.getByRole('button', { name: 'Valider' }).click();
    await logout(page);

    await loginAs(page, 'dg');
    await page.goto('/dashboard/courriers/a-signer');
    await expect(page.getByRole('heading', { name: 'Courriers a signer' })).toBeVisible();
    await page.getByRole('link', { name: 'Deposer le PDF signe' }).click();
    await expect(page.getByRole('heading', { name: 'Deposer le courrier signe' })).toBeVisible();
    await page.setInputFiles('input[type="file"]', {
      name: 'signe.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n'),
    });
    await page.getByLabel('Canal').selectOption('REMISE_PAPIER');
    await page.getByLabel('Reference', { exact: true }).last().fill('REM-1');
    await page.getByRole('button', { name: 'Declarer la remise' }).click();
    await page.goto('/suivi');
    await page.getByLabel('NCC').fill('7654321B');
    await page.getByLabel('E-mail').fill('garage@example.test');
    await page.getByRole('button', { name: 'Rechercher' }).click();
    await expect(page.getByText('CLOTUREE')).toBeVisible();
  });

  test('parcours rejet automatique', async ({ page }) => {
    await mockApi(page);
    await page.goto('/suivi');
    await page.getByLabel('NCC').fill('1111111C');
    await page.getByLabel('E-mail').fill('imprimerie@example.test');
    await page.getByRole('button', { name: 'Rechercher' }).click();
    await expect(page.getByText('REJETEE')).toBeVisible();
    await expect(page.getByText('Telephone manquant')).toBeVisible();
  });

  test('parcours rejet par agent puis reprise cycle 2', async ({ page }) => {
    const state = await mockApi(page);
    await loginAs(page, 'agent.gudef');
    await page.goto('/dashboard/rejets');
    await expect(page.getByRole('heading', { name: 'Rejets' })).toBeVisible();
    await page.getByRole('button', { name: 'Reprendre' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Reprendre' }).click();
    await expect.poll(() => state.reprise()).toBe(true);
  });
});

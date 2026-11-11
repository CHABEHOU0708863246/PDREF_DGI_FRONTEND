import type { APIRequestContext } from '@playwright/test';
import { totpForLogin, waitNextMfaStep } from './mfa-state';

export const API = '/api/v1';

const accessTokenCache = new Map<string, string>();

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export async function apiLogin(
  request: APIRequestContext,
  login: string,
  password: string,
  mfaSecret: string,
): Promise<string> {
  const cached = accessTokenCache.get(login);
  if (cached) {
    return cached;
  }

  const response = await request.post(`${API}/auth/login`, { data: { login, password } });
  const text = await response.text();
  if (!response.ok()) {
    throw new Error(`Login API ${login} refuse (${response.status()}): ${text}`);
  }

  const data = (JSON.parse(text) as ApiEnvelope<{ accessToken: string; challengeToken?: string }>)
    .data;
  if (!data.challengeToken) {
    accessTokenCache.set(login, data.accessToken);
    return data.accessToken;
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const verified = await request.post(`${API}/auth/mfa/verify`, {
      data: { challengeToken: data.challengeToken, code: await totpForLogin(login, mfaSecret) },
    });
    const verifiedText = await verified.text();
    if (verified.ok()) {
      const accessToken = (JSON.parse(verifiedText) as ApiEnvelope<{ accessToken: string }>).data
        .accessToken;
      accessTokenCache.set(login, accessToken);
      return accessToken;
    }
    if (attempt === 1) {
      throw new Error(
        `Verification MFA API ${login} refusee (${verified.status()}): ${verifiedText}`,
      );
    }
    await waitNextMfaStep();
  }

  throw new Error(`Verification MFA API ${login} impossible.`);
}

export async function apiData<T>(
  request: APIRequestContext,
  token: string,
  method: 'get' | 'post' | 'put',
  path: string,
  data?: unknown,
): Promise<T> {
  const response = await request[method](`${API}${path}`, {
    headers: authHeaders(token),
    data,
  });
  const text = await response.text();
  if (!response.ok()) {
    throw new Error(`API ${method.toUpperCase()} ${path} (${response.status()}): ${text}`);
  }
  return (JSON.parse(text) as ApiEnvelope<T>).data;
}

export async function lookupContribuableId(
  request: APIRequestContext,
  token: string,
  ncc: string,
): Promise<string> {
  const items = await apiData<{ id: string }[]>(
    request,
    token,
    'get',
    `/contribuables/lookup?term=${encodeURIComponent(ncc)}`,
  );
  if (items.length === 0) {
    throw new Error(`Contribuable ${ncc} introuvable.`);
  }
  return items[0].id;
}

export interface CreatedCourrier {
  id: string;
  numero: string;
}

export async function createCourrier(
  request: APIRequestContext,
  token: string,
  ncc: string,
  suffix: string,
): Promise<CreatedCourrier> {
  const contribuableId = await lookupContribuableId(request, token, ncc);
  const numero = `E2E-${Date.now()}-${suffix}`;
  const created = await apiData<{ id: string }>(request, token, 'post', '/courriers', {
    sens: 'ENTRANT',
    typeCourrier: 'COURRIER',
    numero,
    dateArrivee: new Date().toISOString(),
    references: `E2E-${suffix}`,
    expediteur: 'Recette E2E',
    objet: `Depot E2E ${suffix}`,
    contribuableId,
  });
  return { id: created.id, numero };
}

export async function createDemande(
  request: APIRequestContext,
  token: string,
  ncc: string,
  courrierId: string,
  suffix: string,
): Promise<string> {
  const contribuableId = await lookupContribuableId(request, token, ncc);
  const exercices = [
    {
      annee: new Date().getFullYear(),
      touteLaLiasse: true,
      etatsFinanciers: [],
      motifs: [{ code: 'FOND_ERREUR_SAISIE', precision: null }],
      variables: [],
    },
  ];
  const draft = await apiData<{ id: string; version: number }>(
    request,
    token,
    'post',
    '/demandes',
    {
      contribuableId,
      courrierId,
      referenceDepot: `E2E-${suffix}`,
      brouillon: true,
      exercices,
    },
  );

  const upload = await request.post(`${API}/demandes/${draft.id}/pieces-jointes`, {
    headers: authHeaders(token),
    multipart: {
      file: {
        name: `demande-${suffix}.pdf`,
        mimeType: 'application/pdf',
        buffer: pdfBuffer(`Demande ${suffix}`),
      },
    },
  });
  if (!upload.ok()) {
    throw new Error(`Upload PDF demande (${upload.status()}): ${await upload.text()}`);
  }

  const update = await request.put(`${API}/demandes/${draft.id}`, {
    headers: { ...authHeaders(token), 'If-Match': `"${draft.version}"` },
    data: { contribuableId, deposer: true, exercices },
  });
  if (!update.ok()) {
    throw new Error(`Depot demande (${update.status()}): ${await update.text()}`);
  }
  return draft.id;
}

export async function createRejet(
  request: APIRequestContext,
  token: string,
  demandeId: string,
): Promise<string> {
  const rejet = await apiData<{ id: string }>(
    request,
    token,
    'post',
    `/demandes/${demandeId}/rejets`,
    {
      motifCode: 'PIECE_JUSTIFICATIVE_MANQUANTE',
      commentaire: 'Piece justificative manquante constatee par agent E2E.',
      pieceComplementaireRequise: true,
    },
  );
  return rejet.id;
}

export async function getDemandeNumero(
  request: APIRequestContext,
  token: string,
  demandeId: string,
): Promise<string> {
  const demande = await apiData<{ numero: string }>(
    request,
    token,
    'get',
    `/demandes/${demandeId}`,
  );
  return demande.numero;
}

export async function getRejet(
  request: APIRequestContext,
  token: string,
  rejetId: string,
): Promise<{ statut: string; cycleCourant: number; cycle: number }> {
  return apiData(request, token, 'get', `/rejets/${rejetId}`);
}

export function pdfBuffer(label: string): Buffer {
  return Buffer.from(
    `%PDF-1.4
% ${label}
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 0 >>
endobj
trailer
<< /Root 1 0 R >>
%%EOF
`,
    'latin1',
  );
}

export function eicarPdfBuffer(): Buffer {
  const eicar = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
  return Buffer.from(
    `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 0 >>
endobj
3 0 obj
<< /Length ${eicar.length} >>
stream
${eicar}
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF
`,
    'latin1',
  );
}

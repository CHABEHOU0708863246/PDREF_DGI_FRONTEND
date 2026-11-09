export type CourrierSens = 'ENTRANT' | 'SORTANT';

export type CourrierType = 'COURRIER' | 'SIGICI' | 'PORTAIL' | 'REPONSE_DGI';

export interface CourrierContribuable {
  id: string;
  ncc: string | null;
  nccMasque: string;
  raisonSociale: string;
}

export interface CourrierSummary {
  id: string;
  sens: CourrierSens;
  typeCourrier: CourrierType;
  numero: string;
  dateArrivee: string | null;
  dateEmission: string | null;
  references: string | null;
  expediteur: string;
  objet: string;
  imputation: string;
  estLie: boolean;
  contribuable: CourrierContribuable | null;
  createdAt: string;
}

export interface CourrierDetail extends CourrierSummary {
  instructionsDirecteur: string | null;
  annotationsSdGudef: string | null;
  demandeId: string | null;
  signatureStatut: string | null;
  signatureReference: string | null;
  signatureLe: string | null;
  depotEImpotsStatut: string | null;
  depotEImpotsLe: string | null;
  referenceDepot: string | null;
  signatureMode: string | null;
  remiseStatut: string | null;
  remiseCanal: string | null;
  remiseDate: string | null;
  updatedAt: string | null;
  version: number;
}

export interface CourrierASigner {
  courrierId: string;
  numero: string;
  objet: string;
  demandeId: string;
  numeroDemande: string;
  raisonSociale: string | null;
  decisionLe: string;
  joursDepuisDecision: number;
  signatureStatut: string;
}

export interface CourrierPage {
  items: CourrierSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface CourrierQuery {
  typeCourrier?: CourrierType | null;
  sens?: CourrierSens | null;
  dateDu?: string | null;
  dateAu?: string | null;
  expediteur?: string | null;
  lie?: boolean | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface CourrierWrite {
  sens?: CourrierSens;
  typeCourrier?: Exclude<CourrierType, 'PORTAIL' | 'REPONSE_DGI'>;
  numero?: string;
  dateArrivee?: string | null;
  dateEmission?: string | null;
  references?: string | null;
  expediteur?: string;
  objet?: string;
  instructionsDirecteur?: string | null;
  annotationsSdGudef?: string | null;
  contribuableId?: string | null;
}

export interface CourrierLookup {
  id: string;
  numero: string;
  objet: string;
  sens: CourrierSens;
  typeCourrier: CourrierType;
  date: string;
}

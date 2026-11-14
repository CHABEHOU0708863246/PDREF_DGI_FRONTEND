export interface DemandeReference {
  code: string;
  libelle: string;
  precision?: string | null;
}

export interface DemandeVariable {
  code: string;
  libelle: string;
  type: 'MONTANT' | 'TEXTE';
  montant?: number | null;
  texte?: string | null;
}

export interface DemandeExercice {
  annee: number;
  touteLaLiasse: boolean;
  etatsFinanciers: DemandeReference[];
  motifs: DemandeReference[];
  variables: DemandeVariable[];
}

export interface DemandeConformite {
  statut: string;
  champsManquants: string[];
  motifRejetCode: string | null;
  verifieLe: string | null;
}

export interface DemandeEtape {
  statut: string;
  outcome: string | null;
  activeLe: string | null;
  echeance: string | null;
  decideLe: string | null;
  assigneeUserId?: string | null;
}

export interface DemandeCircuit {
  code: string;
  version: number;
  statut: string;
  demarreLe: string;
  etapeCourante: string | null;
  etapes: Record<string, DemandeEtape>;
}

export interface DemandeContribuable {
  id: string | null;
  ncc: string;
  raisonSociale: string;
  centreImpotId: string;
  centreImpotLibelle: string | null;
  directionRattachementId: string;
  directionLibelle?: string | null;
}

export interface DemandeSummary {
  id: string;
  numero: string | null;
  origine: string;
  statut: string;
  contribuable: DemandeContribuable;
  dateDepot: string | null;
  pdfManquant?: boolean;
  exercicePrincipal: number;
  etapeCourante: string | null;
  createdAt: string;
}

export interface DemandeDetail extends DemandeSummary {
  courrierId: string | null;
  courrierNumero?: string | null;
  referenceDepot: string | null;
  exercices: DemandeExercice[];
  conformite: DemandeConformite;
  circuit: DemandeCircuit | null;
  directionIds: string[];
  updatedAt: string | null;
  version: number;
}

export interface DemandePage {
  items: DemandeSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface DemandeQuery {
  search?: string | null;
  statut?: string | null;
  origine?: string | null;
  dateDu?: string | null;
  dateAu?: string | null;
  page?: number;
  pageSize?: number;
}

export interface DemandeMotifWrite {
  code: string;
  precision?: string | null;
}

export interface DemandeVariableWrite {
  code: string;
  libelle: string;
  type: 'MONTANT' | 'TEXTE';
  montant?: number | null;
  texte?: string | null;
}

export interface DemandeExerciceWrite {
  annee: number;
  touteLaLiasse: boolean;
  etatsFinanciers: string[];
  motifs: DemandeMotifWrite[];
  variables: DemandeVariableWrite[];
}

export interface DemandeWrite {
  contribuableId?: string | null;
  ncc?: string | null;
  courrierId?: string | null;
  referenceDepot?: string | null;
  email?: string | null;
  telephone?: string | null;
  brouillon?: boolean;
  deposer?: boolean;
  exercices: DemandeExerciceWrite[];
}

export interface DemandeFormulaire {
  exercices: Array<{ annee: number; libelle: string }>;
  etatsFinanciers: Array<{ code: string; libelle: string }>;
  motifs: Array<{ code: string; libelle: string }>;
  champsConformite: string[];
  variablesMax: number;
  variablesMaxParExercice: number;
  pdfMinimum: number;
  plausibiliteSeuilPct: number | null;
}

export interface DemandePdf {
  blob: Blob;
  fileName: string | null;
}

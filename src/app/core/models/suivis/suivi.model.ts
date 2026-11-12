export interface SuiviContribuable {
  ncc: string;
  raisonSociale: string;
}

export interface Article24Controles {
  insuffisanceMemeNature3Ans: boolean | null;
  engagementRedressementEnCours: boolean | null;
  avisVerificationComptabilite: boolean | null;
  verificationApprofondieEnCours: boolean | null;
}

export interface AvisDirection {
  id: string;
  etapeCode: string;
  directionId: string;
  directionCode: string;
  statut: string;
  decision: string | null;
  motifCode: string | null;
  commentaire: string | null;
  article24?: Article24Controles;
  emisLe: string | null;
  emisPar: string | null;
  echeance: string | null;
}

export interface ValidationGlobale {
  id: string | null;
  statut: string | null;
  decision: string | null;
  motifCode: string | null;
  commentaire: string | null;
  decidePar: string | null;
  decideLe: string | null;
  courrierReponseId: string | null;
  signatureStatut: string | null;
  depotEImpotsStatut: string | null;
  referenceDepotEImpots: string | null;
  clotureLe: string | null;
}

export interface CorrectionDecision {
  id: string;
  cibleType: string;
  cibleId: string;
  ancienneDecision: string | null;
  nouvelleDecision: string;
  motif: string;
  empreinteSha256: string;
  corrigePar: string;
  corrigeLe: string;
}

export interface TransmissionSuivi {
  id: string;
  destinataireUserIds: string[];
  commentaireInterne: string | null;
  emisLe: string;
  emisPar: string;
}

export interface SuiviEtape {
  code: string;
  statut: string;
  outcome: string | null;
  activeLe: string | null;
  echeance: string | null;
  decideLe: string | null;
}

export interface SuiviDossier {
  id: string;
  demandeId: string;
  numero: string;
  cycle: number;
  contribuable: SuiviContribuable;
  statut: string;
  avisRecus: number;
  avisTotal: number;
  avisFavorables: number;
  avisNonFavorables: number;
  transmissionsCount: number;
  etapeCourante: string | null;
  demandeStatut: string | null;
  dateDepot: string | null;
  dateOuverture: string;
  dateCloture: string | null;
}

export interface SuiviDetail extends SuiviDossier {
  avis: AvisDirection[];
  validationGlobale: ValidationGlobale | null;
  corrections: CorrectionDecision[];
  transmissions: TransmissionSuivi[];
  directionIds: string[];
  etapes: SuiviEtape[];
  assigneeUserId?: string | null;
  assignedAt?: string | null;
  instruction?: string | null;
}

export interface SuiviPage {
  items: SuiviDossier[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface SuiviQuery {
  search?: string | null;
  statut?: string | null;
  page?: number;
  pageSize?: number;
}

export interface MotifNonFavorable {
  code: string;
  libelle: string;
}

export interface AvisDecisionWrite {
  decision: 'FAVORABLE' | 'NON_FAVORABLE';
  motifCode?: string | null;
  commentaire?: string | null;
  article24?: Article24Controles;
}

export interface ValidationGlobaleWrite {
  decision: 'FAVORABLE' | 'NON_FAVORABLE';
  motifCode?: string | null;
  commentaire?: string | null;
}

export interface CorrectionDecisionWrite {
  cibleType: 'AVIS' | 'VALIDATION_GLOBALE';
  cibleId: string;
  nouvelleDecision: 'FAVORABLE' | 'NON_FAVORABLE';
  motif: string;
}

export interface TransmissionSuiviWrite {
  destinataireUserIds: string[];
  commentaireInterne?: string | null;
}

export interface TransmissionResult {
  id: string;
  destinatairesCount: number;
  emisLe: string;
}

export interface SignatureResult {
  jobId: string;
  courrierId: string;
  statut: string;
}

export interface DepotResult {
  courrierId: string;
  statut: string;
  referenceDepot: string | null;
  demandeCloturee: boolean;
}

export interface SuiviExport {
  blob: Blob;
  fileName: string | null;
}

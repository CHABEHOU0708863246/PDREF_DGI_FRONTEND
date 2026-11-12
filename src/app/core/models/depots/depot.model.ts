import type {
  DemandeConformite,
  DemandeContribuable,
  DemandeDetail,
  DemandeExerciceWrite,
} from '../demandes/demande.model';

export interface DepotDraft {
  id: string;
  numero: string | null;
  statut: string;
  etape: number;
  version: number;
  updatedAt: string | null;
  derniereSauvegarde: string | null;
  abandonneLe: string | null;
  referenceDepot: string | null;
  contribuable: DemandeContribuable;
  exercices: DemandeExerciceWrite[];
  conformite: DemandeConformite;
}

export interface DepotDraftSummary {
  id: string;
  etape: number;
  version: number;
  updatedAt: string | null;
  exercicePrincipal: number;
  exerciceSecondaire: number;
}

export interface DepotDraftRequest {
  etape: number;
  version: number;
  referenceDepot: string | null;
  exercices: DemandeExerciceWrite[];
}

export interface DepotDepositResult {
  demande: DemandeDetail;
  accuseUrl: string;
}

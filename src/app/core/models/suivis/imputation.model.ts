export interface ImputationItem {
  demandeId: string;
  numero: string;
  contribuable: string;
  ncc: string;
  dateDepot: string | null;
  echeance: string | null;
  statutEtape: string;
  assigneeUserId: string | null;
  assigneeName: string | null;
  assignedBy: string | null;
  assignedAt: string | null;
  instruction: string | null;
  enRetard: boolean;
  historique: ImputationHistorique[];
}

export interface ImputationHistorique {
  assigneeUserId: string;
  assignedBy: string;
  assignedAt: string;
  instruction: string | null;
}

export interface ImputationPage {
  items: ImputationItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  nonAttribues: number;
}

export interface ImputationAgent {
  userId: string;
  displayName: string;
  roleKeys: string[];
}

export interface ImputationQuery {
  statut?: string | null;
  aDistribuer?: boolean;
  page?: number;
  pageSize?: number;
}

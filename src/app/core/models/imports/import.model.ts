export interface ImportJob {
  id: string;
  fileName: string;
  templateVersion: number;
  statut: string;
  totalLignes: number;
  importees: number;
  rejetees: number;
  dejaImportees: number;
  erreurs: number;
  nextLigne: number;
  dateCreation: string;
  startedAt: string | null;
  completedAt: string | null;
  lastErrorCode: string | null;
}

export interface ImportJobDetail extends ImportJob {
  fileSha256: string;
}

export interface ImportPage {
  items: ImportJob[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface ImportError {
  id: string;
  ligne: number;
  colonne: string;
  motif: string;
  valeurBrute: string | null;
}

export interface ImportErrorPage {
  items: ImportError[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface ImportQuery {
  search?: string | null;
  statut?: string | null;
  page?: number;
  pageSize?: number;
}

export interface ImportErrorQuery {
  colonne?: string | null;
  motif?: string | null;
  page?: number;
  pageSize?: number;
}

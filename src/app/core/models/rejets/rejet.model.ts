export interface RejetListItem {
  id: string;
  demandeId: string;
  numeroDemande: string;
  cycle: number;
  cycleCourant: number;
  famille: string;
  motifCode: string;
  motifLibelle: string;
  commentaire: string | null;
  statut: string;
  pieceComplementaireRequise: boolean;
  dateCreation: string;
  dateReprise: string | null;
  dateAbandon: string | null;
  motifAbandon: string | null;
  piecesRecues?: boolean;
  piecesCount?: number;
}

export interface RejetPieceFile {
  fileGroupId: string;
  versionId: string | null;
  fileName: string;
  sizeBytes: number;
  origin: string;
  createdAt: string;
}

export interface RejetPieceDepot {
  id: string;
  rejetId: string;
  demandeId: string;
  message: string | null;
  createdAt: string;
  files: RejetPieceFile[];
}

export interface RejetPiecesDossier {
  rejetId: string;
  demandeId: string;
  motifLibelle: string;
  messageMaxLength: number;
  peutEnvoyer: boolean;
  envois: RejetPieceDepot[];
}

export interface RejetCycle {
  id: string;
  cycle: number;
  famille: string;
  motifCode: string;
  motifLibelle: string;
  statut: string;
  dateCreation: string;
  dateReprise: string | null;
  dateAbandon: string | null;
}

export interface RejetDetail extends RejetListItem {
  pieceComplementaireFileId: string | null;
  reprisePar: string | null;
  abandonnePar: string | null;
  dateClotureDefinitive: string | null;
  piecesContribuable?: RejetPieceDepot[];
  historique: RejetCycle[];
}

export interface RejetMotif {
  code: string;
  libelle: string;
  legacy: boolean;
  selectionnable: boolean;
}

export interface RejetPage {
  items: RejetListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  enAttenteCorrectionCount: number;
  corrigeCount: number;
  abandonneCount: number;
}

export interface RejetQuery {
  search?: string | null;
  statut?: string | null;
  famille?: string | null;
  motifCode?: string | null;
  cycle?: number | null;
  page?: number;
  pageSize?: number;
}

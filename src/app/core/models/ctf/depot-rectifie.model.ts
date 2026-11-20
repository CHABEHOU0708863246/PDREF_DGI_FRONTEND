export interface DepotRectifie {
  id: string;
  demandeId: string;
  cycle: number;
  autorisationId: string;
  numeroEnvoi: number;
  fileGroupIds: string[];
  origine: string;
  deposePar: string;
  dateDepot: string;
  statut: string;
  controlePar: string | null;
  dateControle: string | null;
  motifCode: string | null;
  observation: string | null;
}

export interface DepotRectifieCreateRequest {
  fileGroupIds: string[];
  origine?: string | null;
}

export interface DepotRectifieControlRequest {
  conforme: boolean;
  motifCode?: string | null;
  observation?: string | null;
}

export interface CtfMotifNonConformite {
  code: string;
  libelle: string;
}

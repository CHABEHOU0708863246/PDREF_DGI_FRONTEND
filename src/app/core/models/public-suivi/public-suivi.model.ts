export interface PublicSuiviRequest {
  ncc: string;
  email: string;
}

export interface PublicSuiviEtape {
  code: string;
  date: string;
}

export interface PublicSuiviDossier {
  numero: string;
  statut: string;
  etapes: PublicSuiviEtape[];
  decisionFinale: string | null;
  motifRejet: string | null;
}

export interface PublicSuiviResponse {
  trouve: boolean;
  message: string;
  dossiers: PublicSuiviDossier[];
}

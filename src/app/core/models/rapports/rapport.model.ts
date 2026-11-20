export type RapportType = 'HEBDOMADAIRE' | 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL' | 'PERSONNALISE';
export type RapportFormat = 'PDF' | 'EXCEL' | 'WORD';

export interface RapportLigne {
  directionId: string;
  directionLibelle: string;
  formulees: number;
  traitees: number;
  tauxTraitement: number | null;
  favorables: number;
  tauxReponseFavorable: number | null;
  stockGlobal: number;
  estTotal?: boolean;
}

export interface RapportResponse {
  type: RapportType;
  libelle: string;
  dateDu: string;
  dateAu: string;
  lignes: RapportLigne[];
  legende: string[];
}

export interface RapportStatistiquesKpis {
  formulees: number;
  traitees: number;
  tauxTraitement: number | null;
  favorables: number;
  tauxReponseFavorable: number | null;
  stockGlobal: number;
  formuleesPrecedent: number;
  traiteesPrecedent: number;
  favorablesPrecedent: number;
  stockGlobalPrecedent: number;
}

export interface RapportStatistiquesLigne {
  code: string;
  libelle: string;
  courant: number;
  precedent: number;
  ecart: number;
  estTotal?: boolean;
}

export interface RapportStatistiquesSection {
  code: string;
  titre: string;
  lignes: RapportStatistiquesLigne[];
}

export interface RapportEvolutionPoint {
  label: string;
  courant: number;
  precedent: number;
}

export interface RapportAvisDirectionLigne {
  code: string;
  libelle: string;
  favorables: number;
  nonFavorables: number;
  total: number;
  precedent: number;
  ecart: number;
  estTotal?: boolean;
}

export interface RapportStatistiques {
  type: RapportType;
  libelle: string;
  dateDu: string;
  dateAu: string;
  dateDuPrecedent: string;
  dateAuPrecedent: string;
  kpis: RapportStatistiquesKpis;
  evolution: RapportEvolutionPoint[];
  sections: RapportStatistiquesSection[];
  avis: RapportAvisDirectionLigne[];
  directions: RapportLigne[];
  legende: string[];
}

export interface RapportQuery {
  type?: RapportType;
  dateReference?: string | null;
  dateDu?: string | null;
  dateAu?: string | null;
  directionId?: string | null;
}

export interface RapportExportRequest extends RapportQuery {
  format: RapportFormat;
}

export interface RapportExport {
  id: string;
  format: RapportFormat;
  type: RapportType;
  dateDu: string;
  dateAu: string;
  directionId: string | null;
  statut: 'EN_ATTENTE' | 'EN_PREPARATION' | 'PRET' | 'ECHEC' | 'PURGE';
  fileName: string | null;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  errorMessage: string | null;
}

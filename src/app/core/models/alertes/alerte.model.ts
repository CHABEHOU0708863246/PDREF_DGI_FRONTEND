export interface Alerte {
  id: string;
  demandeId: string;
  numeroDemande: string;
  cycle: number;
  etape: string;
  type: string;
  directionId: string;
  dateEcheance: string;
  joursRetard: number;
  statut: string;
  derniereRelanceAt: string | null;
}

export interface AlertePage {
  items: Alerte[];
  page: number;
  pageSize: number;
  totalCount: number;
  ouvertes: number;
  resolues: number;
  enRetard: number;
}

export interface AlerteStatPoint {
  periode: string;
  libelle: string;
  valeur: number;
}

export interface AlerteStats {
  granularite: string;
  points: AlerteStatPoint[];
}

export interface AlerteQuery {
  dateDu?: string | null;
  dateAu?: string | null;
  directionId?: string | null;
  type?: string | null;
  etape?: string | null;
  statut?: string | null;
  page?: number;
  pageSize?: number;
}

export interface AlerteStatsQuery {
  granularite: 'semaine' | 'mois';
  dateDu?: string | null;
  dateAu?: string | null;
}

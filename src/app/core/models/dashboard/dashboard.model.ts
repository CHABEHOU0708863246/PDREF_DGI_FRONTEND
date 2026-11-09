export interface DashboardKpis {
  courriersRecus: number;
  rejetes: number;
  totalDemandes: number;
  enCours: number;
  favorables: number;
  nonFavorables: number;
  enRetard: number;
  dateCalcul: string;
}

export interface DashboardNominatifItem {
  demandeId: string;
  numeroDemande: string;
  contribuable: string;
  ncc: string;
  etat: string;
  niveauTraitement: string;
  delaiGudefJo: number;
  delaiDirectionsJo: number;
  delaiCtfJo: number;
}

export interface DashboardNominatifPage {
  items: DashboardNominatifItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface DashboardQualite {
  totalContribuables: number;
  sansEmail: number;
  sansTelephone: number;
  sansCentre: number;
  nccHorsFormat: number;
  pourcentageSansEmail: number;
  pourcentageSansTelephone: number;
  pourcentageSansCentre: number;
  pourcentageNccHorsFormat: number;
}

export interface DashboardQuery {
  periode?: string;
  statut?: string | null;
}

export interface DashboardNominatifQuery {
  periode?: string;
  statut?: string | null;
  page?: number;
  pageSize?: number;
}

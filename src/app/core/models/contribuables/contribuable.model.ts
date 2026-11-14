export interface Contribuable {
  id: string;
  ncc: string;
  raisonSociale: string;
  systemeComptable: string;
  centreImpotId: string;
  centreImpotLibelle: string | null;
  directionRattachementId: string;
  secteur: string | null;
  formeJuridique: string | null;
  zoneId: string | null;
  adresse: string | null;
  emailMasque: string | null;
  telephoneMasque: string | null;
  email: string | null;
  telephone: string | null;
  emailManquant: boolean;
  telephoneManquant: boolean;
  nccHorsFormat: boolean;
  centreRattachementManquant: boolean;
  evalueLe: string;
  isArchived: boolean;
  archivedAt: string | null;
}

export interface ContribuablePage {
  items: Contribuable[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface ContribuableQuery {
  search?: string | null;
  ncc?: string | null;
  systemeComptable?: string | null;
  secteur?: string | null;
  sansEmail?: boolean | null;
  sansTelephone?: boolean | null;
  nccHorsFormat?: boolean | null;
  includeArchived?: boolean | null;
  page?: number;
  pageSize?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface ContribuableQuality {
  total: number;
  sansEmail: number;
  sansTelephone: number;
  sansCentre: number;
  nccHorsFormat: number;
  pourcentageSansEmail: number;
  pourcentageSansTelephone: number;
  pourcentageSansCentre: number;
  pourcentageNccHorsFormat: number;
}

export interface ContribuableWrite {
  ncc?: string;
  raisonSociale?: string;
  systemeComptable?: string;
  centreImpotId?: string;
  secteur?: string | null;
  formeJuridique?: string | null;
  zoneId?: string | null;
  adresse?: string | null;
  email?: string | null;
  telephone?: string | null;
}

export interface CentreOption {
  id: string;
  code: string;
  libelle: string;
}

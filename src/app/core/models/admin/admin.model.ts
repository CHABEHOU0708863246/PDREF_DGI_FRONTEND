export type AdminScreen =
  'directions' | 'exercices' | 'listes-valeurs' | 'parametres' | 'modeles-notifications';

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Direction {
  id: string;
  code: string;
  libelle: string;
  type: string | null;
  fonctionCircuit: string | null;
  parentDirectionCode: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  isActive: boolean;
  provisional: boolean;
  legacy: boolean;
  sourceRef: string | null;
  requiresConfirmation: boolean;
  version: number;
}

export interface FiscalYear {
  id: string;
  annee: number;
  libelle: string;
  dateOuverture: string;
  dateCloture: string;
  isActive: boolean;
  provisional: boolean;
  sourceRef: string | null;
  requiresConfirmation: boolean;
  version: number;
}

export interface ValueListItem {
  id: string;
  listeCode: string;
  code: string;
  libelle: string;
  ordre: number;
  isActive: boolean;
  selectable: boolean;
  legacy: boolean;
  provisional: boolean;
  sourceRef: string | null;
  requiresConfirmation: boolean;
  metadonnees: Record<string, string> | null;
  version: number;
}

export interface ParameterVersion {
  id: string;
  cle: string;
  versionNumber: number;
  valeurJson: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  statut: string;
  motifChangement: string;
  provisional: boolean;
  sourceRef: string | null;
}

export interface ParameterDefinition {
  id: string;
  cle: string;
  domaine: string;
  libelle: string;
  type: string;
  unite: string | null;
  min: number | null;
  max: number | null;
  provisional: boolean;
  sourceRef: string | null;
  requiresConfirmation: boolean;
  currentVersion: ParameterVersion | null;
}

export interface NotificationTemplate {
  id: string;
  code: string;
  canal: string;
  langue: string;
  versionModele: number;
  sujet: string;
  corps: string;
  variablesAutorisees: string[];
  statut: string;
  provisional: boolean;
  sourceRef: string | null;
  requiresConfirmation: boolean;
  version: number;
}

export interface ReferenceQuery {
  search?: string;
  listeCode?: string;
  fonction?: string;
  isActive?: boolean;
  legacy?: boolean;
  page?: number;
  pageSize?: number;
}

export const LIST_CODES = [
  { code: 'ETATS_FINANCIERS', label: 'Etats financiers' },
  { code: 'MOTIFS_RECTIFICATION', label: 'Motifs de rectification' },
  { code: 'MOTIFS_REJET', label: 'Motifs de rejet' },
  { code: 'INSTRUCTIONS_SD_GUDEF', label: 'Instructions SD-GUDEF' },
  { code: 'EXPEDITEURS', label: 'Expediteurs' },
  { code: 'SECTEURS', label: 'Secteurs' },
  { code: 'FORMES_JURIDIQUES', label: 'Formes juridiques' },
  { code: 'SYSTEMES_COMPTABLES', label: 'Systemes comptables' },
] as const;

export const DIRECTION_FUNCTIONS = [
  'GUDEF',
  'DERAR',
  'DVFN',
  'CTF',
  'DG',
  'DSI',
  'RATTACHEMENT',
] as const;

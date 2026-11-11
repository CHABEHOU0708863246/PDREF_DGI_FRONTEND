export interface AdhesionCreateRequest {
  ncc: string;
  nom: string;
  prenom: string;
  fonction: string;
  email: string;
  telephone: string;
}

export interface AdhesionMessage {
  message: string;
}

export interface AdhesionPiece {
  type: string;
  fileName: string;
}

export interface AdhesionVerify {
  jeton: string;
  emailMasque: string;
  statut: string;
  pieces: AdhesionPiece[];
}

export interface AdhesionSuivi {
  statut: string;
  pieces: AdhesionPiece[];
  peutSoumettre: boolean;
}

export interface AdhesionListItem {
  id: string;
  ncc: string;
  raisonSociale: string;
  demandeur: string;
  emailMasque: string;
  statut: string;
  createdAt: string;
  nccConnu: boolean;
  emailEcart: boolean;
  compteActif: boolean;
}

export interface AdhesionPieceDetail {
  type: string;
  fileName: string;
  versionId: string;
  uploadedAt: string;
}

export interface AdhesionDetail {
  id: string;
  ncc: string;
  raisonSociale: string;
  nom: string;
  prenom: string;
  fonction: string;
  email: string;
  telephone: string;
  statut: string;
  createdAt: string;
  nccConnu: boolean;
  emailEcart: boolean;
  compteActif: boolean;
  pieces: AdhesionPieceDetail[];
  motifRefusCode: string | null;
}

export interface AdhesionMotif {
  code: string;
  libelle: string;
}

export interface AdhesionCompte {
  userId: string;
  login: string;
  displayName: string;
  email: string | null;
  contribuableId: string | null;
  ncc: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface EspaceEtape {
  code: string;
  date: string;
}

export interface EspaceDossier {
  id: string;
  numero: string;
  statut: string;
  dateDepot: string | null;
  decision: string | null;
  motifRejet: string | null;
  chronologie: EspaceEtape[];
  courrierDisponible: boolean;
}

export const ADHESION_PIECE_TYPES = [
  { code: 'AUTORISATION_MANDATAIRE', label: 'Autorisation signée du mandataire social' },
  { code: 'PIECE_IDENTITE', label: "Pièce d'identité" },
] as const;

export const ADHESION_STATUT_LABELS: Record<string, string> = {
  EMAIL_A_VERIFIER: 'E-mail à vérifier',
  PIECES_A_FOURNIR: 'Pièces à fournir',
  EN_ATTENTE_VALIDATION: 'En attente de validation',
  ACCEPTEE: 'Acceptée',
  REFUSEE: 'Refusée',
};

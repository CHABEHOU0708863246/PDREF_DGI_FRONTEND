export interface CtfListItem {
  id: string;
  demandeId: string;
  numeroDemande: string;
  cycle: number;
  ncc: string;
  raisonSociale: string;
  statut: string;
  dateCreation: string;
  echeanceActivation: string;
  echeanceDepot: string;
  joursRestantsActivation: number;
  joursRestantsDepot: number;
  motifCloture: string | null;
  dateCloture: string | null;
}

export interface CtfDetail extends CtfListItem {
  courrierId: string;
  idempotencyKey: string;
  referenceActivation: string | null;
  dateActivationDemandee: string | null;
  dateActivation: string | null;
  dateInformation: string | null;
  dateRetourGudef: string | null;
  dateDepotRectifie: string | null;
  referenceDepotRectifie: string | null;
  modeActivation: string | null;
  modeDepotRectifie: string | null;
  tentatives: number;
  derniereErreur: string | null;
}

export interface CtfQuery {
  search?: string | null;
  statut?: string | null;
}

export interface CtfManualActivationRequest {
  reference: string;
  dateActivation: string;
  preuveVersionId?: string | null;
}

export interface CtfManualDepotRequest {
  reference: string;
  dateDepot: string;
}

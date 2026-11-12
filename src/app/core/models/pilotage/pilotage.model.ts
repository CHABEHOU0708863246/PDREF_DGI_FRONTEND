export interface PilotageDossier {
  demandeId: string;
  numero: string;
  contribuable: string;
  ncc: string;
  statut: string;
  etapeCourante: string | null;
  dateDepot: string | null;
  enRetard: boolean;
}

export interface PilotagePage {
  items: PilotageDossier[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface WorkloadAgent {
  userId: string;
  displayName: string;
  directionCode: string;
  enCours: number;
  enRetard: number;
}

export interface WorkloadDirection {
  directionId: string;
  enCours: number;
  enRetard: number;
}

export interface Workload {
  agents: WorkloadAgent[];
  directions: WorkloadDirection[];
}

export interface PilotageQuery {
  source: string;
  metric?: string;
  periode?: string;
  statut?: string;
  directionId?: string;
  type?: string;
  etape?: string;
  agentUserId?: string;
  dateDu?: string;
  dateAu?: string;
  rapportType?: string;
  dateReference?: string;
  page?: number;
  pageSize?: number;
}

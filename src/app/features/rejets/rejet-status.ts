export const REJET_STATUTS = [
  { value: 'EN_ATTENTE_CORRECTION', label: 'En attente de correction' },
  { value: 'CORRIGE', label: 'Corrigé' },
  { value: 'ABANDONNE', label: 'Abandonné' },
  { value: 'CLOTURE_DEFINITIVE', label: 'Clôture définitive' },
] as const;

export const REJET_FAMILLES = [
  { value: 'PAR_AGENT', label: 'Rejet agent' },
  { value: 'AUTOMATIQUE_CONFORMITE', label: 'Automatique (conformité)' },
] as const;

export function rejetStatutLabel(statut: string): string {
  return REJET_STATUTS.find((item) => item.value === statut)?.label ?? statut;
}

export function rejetFamilleLabel(famille: string): string {
  return REJET_FAMILLES.find((item) => item.value === famille)?.label ?? famille;
}

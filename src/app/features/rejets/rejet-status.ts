export const REJET_STATUTS = [
  { value: 'EN_ATTENTE_CORRECTION', label: 'En attente de correction' },
  { value: 'CORRIGE', label: 'Corrige' },
  { value: 'ABANDONNE', label: 'Abandonne' },
  { value: 'CLOTURE_DEFINITIVE', label: 'Cloture definitive' },
] as const;

export const REJET_FAMILLES = [
  { value: 'PAR_AGENT', label: 'Rejet agent' },
  { value: 'AUTOMATIQUE_CONFORMITE', label: 'Automatique conformite' },
] as const;

export function rejetStatutLabel(statut: string): string {
  return REJET_STATUTS.find((item) => item.value === statut)?.label ?? statut;
}

export function rejetFamilleLabel(famille: string): string {
  return REJET_FAMILLES.find((item) => item.value === famille)?.label ?? famille;
}

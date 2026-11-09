export const IMPORT_STATUTS = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINE', label: 'Termine' },
  { value: 'ECHEC', label: 'Echec' },
] as const;

export function importStatutLabel(statut: string): string {
  return IMPORT_STATUTS.find((item) => item.value === statut)?.label ?? statut;
}

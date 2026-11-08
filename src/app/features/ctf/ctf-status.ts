export const CTF_STATUTS = [
  { value: 'A_ACTIVER', label: 'A activer' },
  { value: 'ACTIVATION_DEMANDEE', label: 'Activation demandee' },
  { value: 'ACTIVEE', label: 'Activee' },
  { value: 'ECHEC_ACTIVATION', label: 'Echec activation' },
  { value: 'CONTRIBUABLE_INFORME', label: 'Contribuable informe' },
  { value: 'CLOTUREE', label: 'Cloturee' },
] as const;

export function ctfStatutLabel(statut: string): string {
  return CTF_STATUTS.find((item) => item.value === statut)?.label ?? statut;
}

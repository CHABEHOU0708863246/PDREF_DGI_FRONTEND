export const CTF_STATUTS = [
  { value: 'A_ACTIVER', label: 'À activer' },
  { value: 'ACTIVATION_DEMANDEE', label: 'Activation demandée' },
  { value: 'ACTIVEE', label: 'Activée' },
  { value: 'ECHEC_ACTIVATION', label: 'Échec d’activation' },
  { value: 'CONTRIBUABLE_INFORME', label: 'Contribuable informé' },
  { value: 'CLOTUREE', label: 'Clôturée' },
] as const;

export function ctfStatutLabel(statut: string): string {
  return CTF_STATUTS.find((item) => item.value === statut)?.label ?? statut;
}

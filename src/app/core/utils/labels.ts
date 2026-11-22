/**
 * Libelles lisibles des codes techniques du circuit.
 * Un code inconnu est rendu tel quel : rien n'est masque a l'utilisateur.
 */

const ETAPES: Readonly<Record<string, string>> = {
  CONFORMITE_AUTO: 'Contrôle automatique',
  VERIF_GUDEF: 'Vérification GUDEF',
  AVIS_DERAR: 'Avis DERAR',
  AVIS_DVFN: 'Avis DVFN',
  AVIS_RATTACHEMENT: 'Avis de la direction de rattachement',
  VALIDATION_GLOBALE_GUDEF: 'Validation globale',
  AUTORISATION_CTF: 'Autorisation de rectification',
  DEPOT_CONTRIBUABLE: 'Dépôt rectifié par l’entreprise',
  CLOTURE: 'Clôture',
  NON_FAVORABLE: 'Refus (non favorable)',
  REJET_CONFORMITE: 'Rejet automatique',
  GLOBAL: 'Délai global',
  LEGACY: 'Ancien circuit',
};

const DECISIONS: Readonly<Record<string, string>> = {
  FAVORABLE: 'Favorable',
  NON_FAVORABLE: 'Non favorable',
};

const STATUTS_ETAPE: Readonly<Record<string, string>> = {
  EN_ATTENTE: 'À venir',
  ACTIVE: 'En cours',
  FRANCHIE: 'Terminée',
  FAVORABLE: 'Favorable',
  NON_FAVORABLE: 'Non favorable',
  ANNULEE: 'Annulée',
  EN_RETARD: 'En retard',
};

const STATUTS_AVIS: Readonly<Record<string, string>> = {
  EN_ATTENTE: 'En attente',
  EMIS: 'Émis',
  ANNULE: 'Annulé',
};

const STATUTS_CIRCUIT: Readonly<Record<string, string>> = {
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  NON_ACTIVE: 'Non activé',
};

const STATUTS_DEMANDE: Readonly<Record<string, string>> = {
  BROUILLON: 'Brouillon',
  DEPOSEE: 'Déposée',
  EN_CIRCUIT: 'En cours de traitement',
  REJETEE: 'Rejetée',
  CLOTUREE: 'Clôturée',
  ABANDONNEE: 'Abandonnée',
};

const STATUTS_DEPOT_RECTIFIE: Readonly<Record<string, string>> = {
  SOUMIS: 'En attente de contrôle',
  CONFORME: 'Conforme',
  NON_CONFORME: 'Non conforme',
};

function lookup(
  table: Readonly<Record<string, string>>,
  code: string | null | undefined,
  fallback: string,
): string {
  if (!code) {
    return fallback;
  }
  return table[code] ?? code;
}

/** Statut d'une etape du circuit (ACTIVE -> En cours). */
export function etapeStatutLabel(code: string | null | undefined, fallback = '-'): string {
  return lookup(STATUTS_ETAPE, code, fallback);
}

/** Statut d'un avis de direction (EMIS -> Émis). */
export function avisStatutLabel(code: string | null | undefined, fallback = '-'): string {
  return lookup(STATUTS_AVIS, code, fallback);
}

/** Statut global du circuit (EN_COURS -> En cours). */
export function circuitStatutLabel(code: string | null | undefined, fallback = '-'): string {
  return lookup(STATUTS_CIRCUIT, code, fallback);
}

/** Statut d'une demande (EN_CIRCUIT -> En cours de traitement). */
export function demandeStatutLabel(code: string | null | undefined, fallback = '-'): string {
  return lookup(STATUTS_DEMANDE, code, fallback);
}

/** Statut d'un depot rectifie (SOUMIS -> En attente de contrôle). */
export function depotRectifieStatutLabel(code: string | null | undefined, fallback = '-'): string {
  return lookup(STATUTS_DEPOT_RECTIFIE, code, fallback);
}

/** Libelle d'une etape du circuit (VERIF_GUDEF -> Vérification GUDEF). */
export function etapeLabel(code: string | null | undefined, fallback = '-'): string {
  if (!code) {
    return fallback;
  }
  return ETAPES[code] ?? code;
}

/** Libelle d'une decision d'avis ou de validation. */
export function decisionLabel(code: string | null | undefined, fallback = '-'): string {
  if (!code) {
    return fallback;
  }
  return DECISIONS[code] ?? code;
}

const INSTRUCTION_LABELS: Record<string, string> = {
  ACCEPTE_POUR_TRAITEMENT: 'Accepté pour traitement',
  VERIFICATION_SIMPLE: 'Vérification simple',
  VERIFICATION_APPROFONDIE: 'Vérification approfondie',
};

export function instructionLabel(value: string | null | undefined, fallback = '-'): string {
  if (!value) {
    return fallback;
  }
  if (INSTRUCTION_LABELS[value]) {
    return INSTRUCTION_LABELS[value];
  }
  const readable = value.replaceAll('_', ' ').toLowerCase();
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

const MOTIFS: Readonly<Record<string, string>> = {
  PIECES_MANQUANTES: 'Pièces manquantes',
  PIECE_ILLISIBLE: 'Pièce illisible',
  FORMAT_INCORRECT: 'Format incorrect',
  MONTANT_INCOHERENT: 'Montant incohérent',
  CONFORMITE_INCOMPLETE: 'Fiche contribuable incomplète',
  AUTRE: 'Autre',
};

const CHAMPS: Readonly<Record<string, string>> = {
  ncc: 'NCC',
  raisonSociale: 'Raison sociale',
  centreRattachement: 'Centre de rattachement',
  telephone: 'Téléphone',
  email: 'E-mail',
};

function humanize(code: string): string {
  const readable = code.replaceAll('_', ' ').toLowerCase();
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

/** Libelle d'un motif (rejet, non-conformite) : PIECES_MANQUANTES -> Pièces manquantes. */
export function motifLabel(code: string | null | undefined, fallback = '-'): string {
  if (!code) {
    return fallback;
  }
  return MOTIFS[code] ?? humanize(code);
}

/** Libelle d'un champ de fiche contribuable : telephone -> Téléphone. */
export function champLabel(code: string): string {
  return CHAMPS[code] ?? code;
}

import type { IconName } from './icon.model';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface StatusDescriptor {
  code: string;
  label: string;
  tone: StatusTone;
  icon: IconName;
  pulse?: boolean;
}

/** Catalogue des statuts affiches dans l'interface. */
export const STATUS_CATALOG: Readonly<Record<string, StatusDescriptor>> = {
  DEMO_PENDING: {
    code: 'DEMO_PENDING',
    label: 'En attente',
    tone: 'neutral',
    icon: 'clock',
  },
  DEMO_ACTIVE: {
    code: 'DEMO_ACTIVE',
    label: 'En cours',
    tone: 'info',
    icon: 'loader',
  },
  DEMO_SUCCESS: {
    code: 'DEMO_SUCCESS',
    label: 'Terminé',
    tone: 'success',
    icon: 'check',
  },
  DEMO_WARNING: {
    code: 'DEMO_WARNING',
    label: 'Attention',
    tone: 'warning',
    icon: 'alert-triangle',
    pulse: true,
  },
  DEMO_DANGER: {
    code: 'DEMO_DANGER',
    label: 'Erreur',
    tone: 'danger',
    icon: 'alert-circle',
  },
};

export function resolveStatus(code: string, label?: string, tone?: StatusTone): StatusDescriptor {
  const known = STATUS_CATALOG[code];
  if (known) {
    return {
      ...known,
      label: label ?? known.label,
      tone: tone ?? known.tone,
    };
  }

  return {
    code,
    label: label ?? code,
    tone: tone ?? 'neutral',
    icon: 'info',
  };
}

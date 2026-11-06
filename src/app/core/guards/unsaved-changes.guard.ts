import { inject } from '@angular/core';
import type { CanDeactivateFn } from '@angular/router';
import { ConfirmDialogService } from '../services/confirm/confirm-dialog.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component?.hasUnsavedChanges()) {
    return true;
  }

  const dialogs = inject(ConfirmDialogService);
  return dialogs.confirm({
    title: 'Modifications non enregistrées',
    message: 'Les modifications saisies seront perdues.',
    details: 'Quitter la page sans enregistrer ?',
    confirmLabel: 'Quitter',
    cancelLabel: 'Rester',
    tone: 'danger',
  });
};

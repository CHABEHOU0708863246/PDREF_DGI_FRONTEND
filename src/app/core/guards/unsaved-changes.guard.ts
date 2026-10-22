import { inject } from '@angular/core';
import type { CanDeactivateFn } from '@angular/router';
import { ConfirmDialogService } from '../services/confirm/confirm-dialog.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component || !component.hasUnsavedChanges()) {
    return true;
  }

  return inject(ConfirmDialogService).confirm({
    title: 'Modifications non enregistrees',
    message: 'Quitter cette page sans enregistrer les modifications ?',
    confirmLabel: 'Quitter',
    cancelLabel: 'Rester',
    tone: 'danger',
  });
};

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmDialogService } from '../../services/confirm/confirm-dialog.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'pdref-confirm-host',
  standalone: true,
  imports: [ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (service.request(); as request) {
      <pdref-confirm-dialog
        [open]="true"
        [title]="request.title"
        [message]="request.message"
        [details]="request.details ?? ''"
        [confirmLabel]="request.confirmLabel ?? 'Confirmer'"
        [cancelLabel]="request.cancelLabel ?? 'Annuler'"
        [tone]="request.tone ?? 'primary'"
        (confirmed)="service.resolve(true)"
        (cancelled)="service.resolve(false)"
      />
    }
  `,
})
export class ConfirmHostComponent {
  readonly service = inject(ConfirmDialogService);
}

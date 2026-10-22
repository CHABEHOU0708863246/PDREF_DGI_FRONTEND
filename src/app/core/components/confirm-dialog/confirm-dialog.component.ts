import type { ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'pdref-confirm-dialog',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      (cancel)="onCancel($event)"
      (click)="onBackdrop($event)"
    >
      <div class="dialog__card">
        <div class="dialog__head">
          <span class="dialog__icon" [class.dialog__icon--danger]="tone() === 'danger'">
            <pdref-icon [name]="tone() === 'danger' ? 'alert-triangle' : 'info'" />
          </span>
          <h2 id="confirm-title">{{ title() }}</h2>
        </div>

        <p id="confirm-message">{{ message() }}</p>
        @if (details()) {
          <p class="dialog__details">{{ details() }}</p>
        }

        <div class="pd-actions">
          <button #cancelButton type="button" class="pd-btn pd-btn--ghost" (click)="cancel()">
            {{ cancelLabel() }}
          </button>
          <button
            type="button"
            class="pd-btn"
            [class.pd-btn--danger]="tone() === 'danger'"
            [class.pd-btn--primary]="tone() !== 'danger'"
            (click)="confirm()"
          >
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </dialog>
  `,
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');

  readonly open = model(false);
  readonly title = input('Confirmation');
  readonly message = input('Confirmer cette action ?');
  readonly details = input<string>();
  readonly confirmLabel = input('Confirmer');
  readonly cancelLabel = input('Annuler');
  readonly tone = input<'primary' | 'danger'>('primary');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  constructor() {
    effect(() => {
      const dialog = this.dialogRef()?.nativeElement;
      if (!dialog) {
        return;
      }

      if (this.open() && !dialog.open) {
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
          queueMicrotask(() => this.cancelButton()?.nativeElement.focus());
        } else {
          dialog.setAttribute('open', '');
        }
      } else if (!this.open() && dialog.open) {
        dialog.close();
      }
    });
  }

  confirm(): void {
    this.open.set(false);
    this.confirmed.emit();
  }

  cancel(): void {
    this.open.set(false);
    this.cancelled.emit();
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.cancel();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }
}

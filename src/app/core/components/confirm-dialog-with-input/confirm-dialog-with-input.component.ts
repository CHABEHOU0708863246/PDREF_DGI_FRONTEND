import type { ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'pdref-confirm-dialog-with-input',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="dialog"
      aria-labelledby="confirm-input-title"
      (cancel)="onCancel($event)"
      (click)="onBackdrop($event)"
    >
      <div class="dialog__card">
        <div class="dialog__head">
          <span class="dialog__icon">
            <pdref-icon name="alert-triangle" />
          </span>
          <h2 id="confirm-input-title">{{ title() }}</h2>
        </div>

        <p>{{ message() }}</p>

        <div class="pd-field">
          <label class="pd-label" for="confirm-input">{{ inputLabel() }}</label>
          @if (multiline()) {
            <textarea
              id="confirm-input"
              class="pd-input confirm-input"
              [value]="value()"
              [attr.placeholder]="placeholder()"
              [attr.aria-invalid]="invalid()"
              [attr.aria-describedby]="invalid() ? 'confirm-input-error' : 'confirm-input-help'"
              (input)="onInput($event)"
            ></textarea>
          } @else {
            <input
              id="confirm-input"
              class="pd-input"
              type="text"
              [value]="value()"
              [attr.placeholder]="placeholder()"
              [attr.aria-invalid]="invalid()"
              [attr.aria-describedby]="invalid() ? 'confirm-input-error' : 'confirm-input-help'"
              (input)="onInput($event)"
            />
          }
          @if (invalid()) {
            <p id="confirm-input-error" class="pd-error" role="alert">{{ errorMessage() }}</p>
          } @else {
            <p id="confirm-input-help" class="pd-help">{{ hint() }}</p>
          }
        </div>

        <div class="pd-actions">
          <button type="button" class="pd-btn pd-btn--ghost" (click)="cancel()">
            {{ cancelLabel() }}
          </button>
          <button type="button" class="pd-btn pd-btn--danger" (click)="confirm()">
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </dialog>
  `,
  styleUrl: './confirm-dialog-with-input.component.scss',
})
export class ConfirmDialogWithInputComponent {
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  readonly open = model(false);
  readonly title = input('Confirmation');
  readonly message = input('Saisissez un motif pour continuer.');
  readonly inputLabel = input('Motif');
  readonly placeholder = input('Saisissez le motif…');
  readonly hint = input('Ce motif est conserve dans l historique.');
  readonly confirmLabel = input('Confirmer');
  readonly cancelLabel = input('Annuler');
  readonly required = input(true);
  readonly minLength = input(10);
  readonly multiline = input(false);
  readonly initialValue = input('');

  readonly value = signal('');
  readonly invalid = signal(false);

  readonly confirmed = output<string>();
  readonly cancelled = output<void>();

  constructor() {
    effect(() => {
      const dialog = this.dialogRef()?.nativeElement;
      if (!dialog) {
        return;
      }

      if (this.open() && !dialog.open) {
        this.value.set(this.initialValue());
        this.invalid.set(false);
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
      } else if (!this.open() && dialog.open) {
        dialog.close();
      }
    });
  }

  onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement | HTMLTextAreaElement).value);
    this.invalid.set(false);
  }

  confirm(): void {
    const trimmed = this.value().trim();
    if (this.required() && trimmed.length < this.minLength()) {
      this.invalid.set(true);
      return;
    }

    this.open.set(false);
    this.confirmed.emit(trimmed);
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

  errorMessage(): string {
    return `Le motif doit contenir au moins ${this.minLength()} caracteres.`;
  }
}

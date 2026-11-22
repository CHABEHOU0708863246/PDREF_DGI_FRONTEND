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
import { FormsModule } from '@angular/forms';
import type { RejetMotif } from '../../models/rejets/rejet.model';
import { IconComponent } from '../icon/icon.component';

export interface RejetDialogValue {
  motifCode: string;
  commentaire: string;
  pieceComplementaireRequise: boolean;
}

@Component({
  selector: 'pdref-rejet-dialog',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="dialog"
      aria-labelledby="rejet-title"
      aria-describedby="rejet-message"
      (cancel)="onCancel($event)"
      (click)="onBackdrop($event)"
    >
      <form class="dialog__card" (submit)="$event.preventDefault(); confirm()">
        <div class="dialog__head">
          <span class="dialog__icon dialog__icon--danger">
            <pdref-icon name="alert-triangle" />
          </span>
          <h2 id="rejet-title">Rejeter le dossier</h2>
        </div>

        <p id="rejet-message">
          Le rejet est definitif pour ce cycle. Le contribuable devra corriger le dossier.
        </p>

        <label class="pd-field">
          <span class="pd-label">Motif obligatoire</span>
          <select
            class="pd-input"
            name="motifCode"
            [ngModel]="motifCode()"
            (ngModelChange)="motifCode.set($event); invalid.set(false)"
            required
          >
            <option value="">Sélectionner un motif</option>
            @for (motif of motifs(); track motif.code) {
              @if (motif.selectionnable && !motif.legacy) {
                <option [value]="motif.code">{{ motif.libelle }}</option>
              }
            }
          </select>
        </label>

        <label class="pd-field">
          <span class="pd-label">Commentaire obligatoire (10 caractères minimum)</span>
          <textarea
            class="pd-input"
            name="commentaire"
            rows="3"
            [ngModel]="commentaire()"
            (ngModelChange)="commentaire.set($event); invalid.set(false)"
            required
          ></textarea>
        </label>

        <label class="pd-field inline">
          <input
            type="checkbox"
            name="pieceComplementaire"
            [ngModel]="pieceComplementaireRequise()"
            (ngModelChange)="pieceComplementaireRequise.set($event)"
          />
          <span class="pd-label">Pièce complémentaire requise</span>
        </label>

        @if (invalid()) {
          <p class="pd-error" role="alert">
            Selectionnez un motif et saisissez un commentaire d'au moins 10 caracteres.
          </p>
        }

        <div class="pd-actions">
          <button type="button" class="pd-btn pd-btn--ghost" (click)="cancel()">Annuler</button>
          <button type="submit" class="pd-btn pd-btn--danger" [disabled]="busy()">
            {{ busy() ? 'Rejet en cours...' : 'Confirmer le rejet' }}
          </button>
        </div>
      </form>
    </dialog>
  `,
  styleUrl: './rejet-dialog.component.scss',
})
export class RejetDialogComponent {
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  readonly open = model(false);
  readonly motifs = input<readonly RejetMotif[]>([]);
  readonly busy = input(false);
  readonly motifCode = signal('');
  readonly commentaire = signal('');
  readonly pieceComplementaireRequise = signal(false);
  readonly invalid = signal(false);
  readonly confirmed = output<RejetDialogValue>();
  readonly cancelled = output<void>();

  constructor() {
    effect(() => {
      const dialog = this.dialogRef()?.nativeElement;
      if (!dialog) {
        return;
      }

      if (this.open() && !dialog.open) {
        this.motifCode.set('');
        this.commentaire.set('');
        this.pieceComplementaireRequise.set(false);
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

  confirm(): void {
    if (this.motifCode().length === 0 || this.commentaire().trim().length < 10) {
      this.invalid.set(true);
      return;
    }

    this.invalid.set(false);
    this.confirmed.emit({
      motifCode: this.motifCode(),
      commentaire: this.commentaire().trim(),
      pieceComplementaireRequise: this.pieceComplementaireRequise(),
    });
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

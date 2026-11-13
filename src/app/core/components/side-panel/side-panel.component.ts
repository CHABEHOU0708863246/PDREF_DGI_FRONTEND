import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import type { ElementRef } from '@angular/core';
import { ConfirmDialogService } from '../../services/confirm/confirm-dialog.service';
import { IconComponent } from '../icon/icon.component';

export type SidePanelSize = 'md' | 'lg' | 'xl';

let nextPanelId = 0;

@Component({
  selector: 'pdref-side-panel',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="side-panel"
      [class.side-panel--md]="size() === 'md'"
      [class.side-panel--lg]="size() === 'lg'"
      [class.side-panel--xl]="size() === 'xl'"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="titleId"
      (cancel)="onCancel($event)"
      (click)="onBackdrop($event)"
    >
      <div class="side-panel__surface">
        <header class="side-panel__head">
          <h2 [id]="titleId">{{ title() }}</h2>
          <button
            #closeButton
            type="button"
            class="pd-icon-btn"
            aria-label="Fermer le panneau"
            (click)="requestClose()"
          >
            <pdref-icon name="close" />
          </button>
        </header>
        <div class="side-panel__body">
          <ng-content />
        </div>
      </div>
    </dialog>
  `,
  styleUrl: './side-panel.component.scss',
})
export class SidePanelComponent {
  private readonly confirm = inject(ConfirmDialogService);
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  readonly titleId = `side-panel-title-${nextPanelId++}`;

  readonly open = input(false);
  readonly title = input.required<string>();
  readonly size = input<SidePanelSize>('md');
  readonly dirty = input(false);
  readonly closeRequested = output<void>();

  constructor() {
    effect(() => {
      const dialog = this.dialogRef()?.nativeElement;
      if (!dialog) {
        return;
      }

      if (this.open() && !dialog.open) {
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
        queueMicrotask(() => {
          const focusable = dialog.querySelector<HTMLElement>(
            '.side-panel__body input:not([type="hidden"]), .side-panel__body select, .side-panel__body textarea, .side-panel__body button, .side-panel__body a[href]',
          );
          (focusable ?? this.closeButton()?.nativeElement)?.focus();
        });
      } else if (!this.open() && dialog.open) {
        dialog.close();
      }
    });
  }

  onCancel(event: Event): void {
    event.preventDefault();
    void this.requestClose();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      void this.requestClose();
    }
  }

  async requestClose(): Promise<void> {
    if (this.dirty()) {
      const confirmed = await this.confirm.confirm({
        title: 'Modifications non enregistrees',
        message: 'Fermer le panneau et perdre les modifications en cours ?',
        confirmLabel: 'Fermer sans enregistrer',
        cancelLabel: 'Continuer la saisie',
        tone: 'danger',
      });
      if (!confirmed) {
        return;
      }
    }
    this.closeRequested.emit();
  }
}

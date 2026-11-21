import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewEncapsulation,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

let nextId = 0;

/**
 * Menu d'actions d'une ligne de tableau.
 *
 * Un seul bouton « ⋮ » par ligne ; un clic ouvre la liste verticale des actions.
 * Le menu est positionne en `fixed` pour ne jamais etre coupe par le defilement
 * horizontal des tableaux. Il se ferme au clic sur une action, au clic exterieur
 * et a la touche Echap ; il suit son bouton quand la page defile.
 *
 * Usage :
 * <pdref-row-actions label="Actions du dossier 2026-0001">
 *   <a class="pd-menu-item" routerLink="...">Ouvrir</a>
 *   <button class="pd-menu-item" type="button" (click)="...">Archiver</button>
 *   <button class="pd-menu-item pd-menu-item--danger" type="button">Supprimer</button>
 * </pdref-row-actions>
 */
@Component({
  selector: 'pdref-row-actions',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <button
      #trigger
      type="button"
      class="pd-row-actions__trigger"
      [attr.aria-label]="label()"
      [attr.title]="label()"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="menuId"
      (click)="toggle($event)"
    >
      <pdref-icon name="more-vertical" />
    </button>
    <div
      class="pd-row-actions__menu"
      role="menu"
      [id]="menuId"
      [hidden]="!open()"
      [style.top.px]="top()"
      [style.bottom.px]="bottom()"
      [style.right.px]="right()"
      (click)="close()"
    >
      <ng-content />
    </div>
  `,
})
export class RowActionsComponent {
  readonly label = input('Actions');

  readonly open = signal(false);
  readonly top = signal<number | null>(null);
  readonly bottom = signal<number | null>(null);
  readonly right = signal(0);
  readonly menuId = `pd-row-actions-${++nextId}`;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  toggle(event: Event): void {
    event.stopPropagation();
    if (this.open()) {
      this.close();
      return;
    }
    this.position();
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.close();
      this.trigger().nativeElement.focus();
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    // Le menu suit son bouton plutot que de se fermer : un clic peut provoquer
    // un petit defilement (mise au point du bouton) qui le refermerait aussitot.
    if (this.open()) {
      this.position();
    }
  }

  private position(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const gap = 4;
    const rect = this.trigger().nativeElement.getBoundingClientRect();
    // Aligne le menu sur le bord droit du bouton : il ne deborde jamais a droite.
    this.right.set(Math.max(gap, window.innerWidth - rect.right));
    // Dans le bas de l'ecran, le menu s'ouvre vers le haut pour rester visible.
    if (rect.bottom > window.innerHeight * 0.6) {
      this.top.set(null);
      this.bottom.set(window.innerHeight - rect.top + gap);
    } else {
      this.bottom.set(null);
      this.top.set(rect.bottom + gap);
    }
  }
}

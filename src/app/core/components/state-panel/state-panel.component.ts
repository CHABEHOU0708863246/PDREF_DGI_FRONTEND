import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ApiProblemDetails } from '../../models/common/api-problem.model';
import { EmptyIllustrationComponent } from '../empty-illustration/empty-illustration.component';
import { ErrorFooterComponent } from '../error-footer/error-footer.component';
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

export type StateKind = 'loading' | 'empty' | 'error' | 'success' | 'ready';

@Component({
  selector: 'pdref-state-panel',
  standalone: true,
  imports: [EmptyIllustrationComponent, ErrorFooterComponent, IconComponent, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state()) {
      @case ('loading') {
        <div class="state-panel state-panel--loading" role="status" aria-live="polite">
          <pdref-skeleton [lines]="4" [label]="title() || 'Chargement'" />
          <p>{{ message() || 'Chargement en cours…' }}</p>
        </div>
      }
      @case ('empty') {
        <div class="state-panel state-panel--empty">
          <pdref-empty-illustration />
          <h3>{{ title() || 'Aucun element' }}</h3>
          <p>{{ message() || 'Aucune donnee a afficher pour le moment.' }}</p>
          @if (actionLabel()) {
            <button type="button" class="pd-btn pd-btn--ghost" (click)="retry.emit()">
              {{ actionLabel() }}
            </button>
          }
        </div>
      }
      @case ('error') {
        <div class="state-panel state-panel--error" role="alert">
          <pdref-icon name="alert-circle" size="lg" />
          <h3>{{ title() || 'Une erreur est survenue' }}</h3>
          <p>{{ message() || 'Impossible de charger les donnees.' }}</p>
          <pdref-error-footer [problem]="problem()" />
          @if (actionLabel()) {
            <button type="button" class="pd-btn pd-btn--primary" (click)="retry.emit()">
              {{ actionLabel() }}
            </button>
          }
        </div>
      }
      @case ('success') {
        <div class="state-panel state-panel--success" role="status">
          <pdref-icon name="check" size="lg" />
          <h3>{{ title() || 'Operation reussie' }}</h3>
          <p>{{ message() || 'Les donnees sont a jour.' }}</p>
        </div>
      }
      @default {
        <ng-content />
      }
    }
  `,
  styleUrl: './state-panel.component.scss',
})
export class StatePanelComponent {
  readonly state = input.required<StateKind>();
  readonly title = input<string>();
  readonly message = input<string>();
  readonly problem = input<ApiProblemDetails | null>(null);
  readonly actionLabel = input<string>();
  readonly compact = input(false);
  readonly retry = output<void>();
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { ProblemStore } from '../../core/services/errors/problem.store';

@Component({
  selector: 'pdref-error-page',
  standalone: true,
  imports: [PageHeaderComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="pd-container pd-page">
      <pdref-page-header
        title="Une erreur est survenue"
        subtitle="Le detail technique n'est jamais affiche. Communiquez la trace au support."
      />
      <pdref-state-panel
        state="error"
        title="Traitement interrompu"
        message="Reessayez ou revenez au tableau de bord."
        [problem]="problem()"
        actionLabel="Reessayer"
        (retry)="retry()"
      />
    </main>
  `,
})
export class ErrorPageComponent {
  private readonly router = inject(Router);
  private readonly store = inject(ProblemStore);

  readonly problem = this.store.lastProblem;

  retry(): void {
    void this.router.navigate(['/dashboard']);
  }
}

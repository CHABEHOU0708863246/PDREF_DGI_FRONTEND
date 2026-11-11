import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { EspaceDossier } from '../../core/models/adhesions/adhesion.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AdhesionGateway } from '../../core/services/adhesions/adhesion.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-espace-dossier-page',
  standalone: true,
  imports: [DatePipe, RouterLink, PageHeaderComponent, StatePanelComponent],
  templateUrl: './espace-dossier-page.component.html',
  styleUrl: './espace-dossier-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspaceDossierPageComponent implements OnInit {
  private readonly gateway = inject(AdhesionGateway);
  private readonly route = inject(ActivatedRoute);
  private readonly correlation = inject(CorrelationService);

  readonly dossier = signal<EspaceDossier | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly notice = signal<string | null>(null);
  readonly id = signal('');

  ngOnInit(): void {
    this.id.set(this.route.snapshot.paramMap.get('id') ?? '');
    if (isLighthouseEnabled()) {
      this.dossier.set({
        id: this.id(),
        numero: 'DOS-2026-0001',
        statut: 'CLOTUREE',
        dateDepot: '2026-11-01T09:00:00Z',
        decision: 'FAVORABLE',
        motifRejet: null,
        chronologie: [
          { code: 'VERIF_GUDEF', date: '2026-11-02T10:00:00Z' },
          { code: 'VALIDATION_GLOBALE', date: '2026-11-03T11:00:00Z' },
        ],
        courrierDisponible: true,
      });
      return;
    }

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.dossier(this.id()).subscribe({
      next: (dossier) => {
        this.dossier.set(dossier);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  download(): void {
    if (this.busy()) {
      return;
    }

    this.busy.set(true);
    this.gateway.downloadCourrier(this.id()).subscribe({
      next: (blob) => {
        this.busy.set(false);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `courrier-${this.dossier()?.numero ?? this.id()}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
        this.notice.set('Courrier telecharge. La remise a ete declaree automatiquement.');
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }
}

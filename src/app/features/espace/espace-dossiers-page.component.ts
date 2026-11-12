import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { EspaceDossier } from '../../core/models/adhesions/adhesion.model';
import type { DepotDraftSummary } from '../../core/models/depots/depot.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AdhesionGateway } from '../../core/services/adhesions/adhesion.gateway';
import { DepotGateway } from '../../core/services/depots/depot.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-espace-dossiers-page',
  standalone: true,
  imports: [DatePipe, RouterLink, PageHeaderComponent, StatePanelComponent],
  templateUrl: './espace-dossiers-page.component.html',
  styleUrl: './espace-dossiers-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspaceDossiersPageComponent implements OnInit {
  private readonly gateway = inject(AdhesionGateway);
  private readonly depotGateway = inject(DepotGateway);
  private readonly correlation = inject(CorrelationService);

  readonly dossiers = signal<EspaceDossier[]>([]);
  readonly drafts = signal<DepotDraftSummary[]>([]);
  readonly loading = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);

  ngOnInit(): void {
    if (isLighthouseEnabled()) {
      this.dossiers.set([
        {
          id: 'lh-dossier-1',
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
        },
      ]);
      return;
    }

    this.load();
  }

  load(): void {
    this.loadDrafts();
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.dossiers().subscribe({
      next: (dossiers) => {
        this.dossiers.set(dossiers);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  private loadDrafts(): void {
    if (isLighthouseEnabled()) {
      return;
    }

    this.depotGateway.drafts().subscribe({
      next: (drafts) => this.drafts.set(drafts),
      error: () => this.drafts.set([]),
    });
  }
}

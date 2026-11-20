import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { EspaceDossier } from '../../core/models/adhesions/adhesion.model';
import type { RejetPiecesDossier } from '../../core/models/rejets/rejet.model';
import type { DepotRectifie } from '../../core/models/ctf/depot-rectifie.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AdhesionGateway } from '../../core/services/adhesions/adhesion.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { RejetPiecesGateway } from '../../core/services/rejets/rejet-pieces.gateway';
import { DepotRectifieGateway } from '../../core/services/ctf/depot-rectifie.gateway';
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
  private readonly rejetPieces = inject(RejetPiecesGateway);
  private readonly depotsRectifies = inject(DepotRectifieGateway);
  private readonly route = inject(ActivatedRoute);
  private readonly correlation = inject(CorrelationService);

  readonly dossier = signal<EspaceDossier | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly notice = signal<string | null>(null);
  readonly id = signal('');
  readonly pieces = signal<RejetPiecesDossier | null>(null);
  readonly selectedFiles = signal<readonly File[]>([]);
  readonly message = signal('');
  readonly piecesError = signal<string | null>(null);
  readonly depots = signal<DepotRectifie[]>([]);
  readonly rectifiedFiles = signal<readonly File[]>([]);
  readonly rectifiedError = signal<string | null>(null);
  readonly rectifiedBusy = signal(false);

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
        this.loadPieces();
        this.loadDepots();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  loadPieces(): void {
    this.rejetPieces.get(this.id()).subscribe({
      next: (pieces) => this.pieces.set(pieces.rejetId ? pieces : null),
      error: () => this.pieces.set(null),
    });
  }

  loadDepots(): void {
    this.depotsRectifies.listEspace(this.id()).subscribe({
      next: (items) => this.depots.set(items),
      error: () => this.depots.set([]),
    });
  }

  onRectifiedFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.rectifiedError.set(null);
    if (files.length === 0) {
      this.rectifiedFiles.set([]);
      return;
    }
    if (files.some((file) => file.size > 2 * 1024 * 1024)) {
      this.rectifiedError.set('Chaque piece doit faire au maximum 2 Mo.');
      this.rectifiedFiles.set([]);
      return;
    }
    if (files.reduce((total, file) => total + file.size, 0) > 5 * 1024 * 1024) {
      this.rectifiedError.set('Le depot ne doit pas depasser 5 Mo.');
      this.rectifiedFiles.set([]);
      return;
    }
    this.rectifiedFiles.set(files);
  }

  sendRectified(): void {
    if (this.rectifiedBusy() || this.rectifiedFiles().length === 0) {
      return;
    }
    this.rectifiedBusy.set(true);
    this.rectifiedError.set(null);
    const uploads = this.rectifiedFiles().map((file) =>
      this.depotsRectifies.uploadEspacePiece(this.id(), file),
    );
    forkJoin(uploads).subscribe({
      next: (groups) => {
        this.depotsRectifies
          .submitEspace(this.id(), {
            fileGroupIds: groups.map((group) => group.id),
            origine: 'CONTRIBUABLE',
          })
          .subscribe({
            next: () => {
              this.rectifiedBusy.set(false);
              this.rectifiedFiles.set([]);
              this.notice.set('Depot rectifie transmis. Le CTF va le controler.');
              this.loadDepots();
            },
            error: (error: unknown) => {
              this.rectifiedBusy.set(false);
              const issue = normalizeProblem(error, this.correlation.last);
              this.rectifiedError.set(issue.detail ?? issue.title);
            },
          });
      },
      error: (error: unknown) => {
        this.rectifiedBusy.set(false);
        const issue = normalizeProblem(error, this.correlation.last);
        this.rectifiedError.set(issue.detail ?? issue.title);
      },
    });
  }

  onFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.piecesError.set(null);
    if (files.length > 10) {
      this.piecesError.set('Maximum 10 pieces par envoi.');
      this.selectedFiles.set([]);
      return;
    }

    if (files.some((file) => file.size > 2 * 1024 * 1024)) {
      this.piecesError.set('Chaque piece doit faire au maximum 2 Mo.');
      this.selectedFiles.set([]);
      return;
    }

    if (files.reduce((total, file) => total + file.size, 0) > 5 * 1024 * 1024) {
      this.piecesError.set('L envoi ne doit pas depasser 5 Mo.');
      this.selectedFiles.set([]);
      return;
    }

    this.selectedFiles.set(files);
  }

  onMessage(event: Event): void {
    this.message.set((event.target as HTMLTextAreaElement).value);
  }

  sendPieces(): void {
    if (this.busy() || this.selectedFiles().length === 0) {
      return;
    }

    this.busy.set(true);
    this.piecesError.set(null);
    this.rejetPieces.send(this.id(), this.selectedFiles(), this.message()).subscribe({
      next: (pieces) => {
        this.busy.set(false);
        this.pieces.set(pieces);
        this.selectedFiles.set([]);
        this.message.set('');
        this.notice.set('Pieces transmises. L agent sera notifie.');
      },
      error: (error: unknown) => {
        this.busy.set(false);
        const issue = normalizeProblem(error, this.correlation.last);
        this.piecesError.set(issue.detail ?? issue.title);
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

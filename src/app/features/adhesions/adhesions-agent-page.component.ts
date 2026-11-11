import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import {
  ADHESION_STATUT_LABELS,
  type AdhesionCompte,
  type AdhesionDetail,
  type AdhesionListItem,
  type AdhesionMotif,
} from '../../core/models/adhesions/adhesion.model';
import { ConfirmDialogWithInputComponent } from '../../core/components/confirm-dialog-with-input/confirm-dialog-with-input.component';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AdhesionGateway } from '../../core/services/adhesions/adhesion.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-adhesions-agent-page',
  standalone: true,
  imports: [
    KeyValuePipe,
    FormsModule,
    PageHeaderComponent,
    StatePanelComponent,
    ConfirmDialogWithInputComponent,
  ],
  templateUrl: './adhesions-agent-page.component.html',
  styleUrl: './adhesions-agent-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdhesionsAgentPageComponent implements OnInit {
  private readonly gateway = inject(AdhesionGateway);
  private readonly correlation = inject(CorrelationService);

  readonly labels = ADHESION_STATUT_LABELS;
  readonly items = signal<AdhesionListItem[]>([]);
  readonly detail = signal<AdhesionDetail | null>(null);
  readonly motifs = signal<AdhesionMotif[]>([]);
  readonly accounts = signal<AdhesionCompte[]>([]);
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly accountsLoading = signal(false);
  readonly busy = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly notice = signal<string | null>(null);
  readonly statut = signal('');
  readonly search = signal('');
  readonly searchAccounts = signal('');
  readonly motifCode = signal('');

  readonly accountDialogOpen = signal(false);
  readonly accountDialogTitle = signal('');
  readonly accountTarget = signal<AdhesionCompte | null>(null);
  readonly accountActive = signal(true);
  readonly accountInputLabel = signal('Motif obligatoire');

  ngOnInit(): void {
    this.load();
    this.loadMotifs();
    this.loadAccounts();
  }

  load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.list(this.statut() || undefined, this.search() || undefined).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  loadMotifs(): void {
    this.gateway.motifs().subscribe({
      next: (motifs) => this.motifs.set(motifs),
      error: () => this.motifs.set([]),
    });
  }

  loadAccounts(): void {
    this.accountsLoading.set(true);
    this.gateway.accounts(this.searchAccounts() || undefined).subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.accountsLoading.set(false);
      },
      error: (error: unknown) => {
        this.accountsLoading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  open(item: AdhesionListItem): void {
    this.detailLoading.set(true);
    this.problem.set(null);
    this.detail.set(null);
    this.gateway.detail(item.id).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.motifCode.set(this.motifs()[0]?.code ?? '');
        this.detailLoading.set(false);
      },
      error: (error: unknown) => {
        this.detailLoading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  accept(): void {
    const item = this.detail();
    if (!item || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.notice.set(null);
    this.gateway.accept(item.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.notice.set('Adhesion acceptee. Une invitation a ete envoyee.');
        this.load();
        this.loadAccounts();
        this.detail.set({ ...item, statut: 'ACCEPTEE', compteActif: true });
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  refuse(): void {
    const item = this.detail();
    if (!item || !this.motifCode() || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.notice.set(null);
    this.gateway.refuse(item.id, this.motifCode()).subscribe({
      next: () => {
        this.busy.set(false);
        this.notice.set('Adhesion refusee. Un e-mail neutre a ete envoye.');
        this.load();
        this.detail.set({ ...item, statut: 'REFUSEE', motifRefusCode: this.motifCode() });
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  downloadPiece(versionId: string, fileName: string): void {
    const item = this.detail();
    if (!item) {
      return;
    }

    this.gateway.downloadPiece(item.id, versionId).subscribe({
      next: (blob) => this.saveBlob(blob, fileName),
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  openAccountDialog(account: AdhesionCompte, active: boolean): void {
    this.accountTarget.set(account);
    this.accountActive.set(active);
    this.accountDialogTitle.set(active ? 'Reactiver le compte' : 'Desactiver le compte');
    this.accountInputLabel.set('Motif obligatoire');
    this.accountDialogOpen.set(true);
  }

  statutLabel(statut: string): string {
    return this.labels[statut] ?? statut;
  }

  confirmAccount(reason: string): void {
    const account = this.accountTarget();
    this.accountDialogOpen.set(false);
    if (!account) {
      return;
    }

    this.busy.set(true);
    const request = this.accountActive()
      ? this.gateway.reactivate(account.userId, reason)
      : this.gateway.deactivate(account.userId, reason);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.notice.set(
          this.accountActive()
            ? 'Compte contribuable reactive.'
            : 'Compte contribuable desactive, sessions revoquees.',
        );
        this.loadAccounts();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

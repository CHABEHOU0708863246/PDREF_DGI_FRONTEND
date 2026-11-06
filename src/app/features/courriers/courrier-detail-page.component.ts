import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { CourrierDetail } from '../../core/models/courriers/courrier.model';
import type { FileGroup } from '../../core/models/files/file.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { CourriersGateway } from '../../core/services/courriers/courriers.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-courrier-detail-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header title="Fiche courrier" [subtitle]="item()?.numero || ''" />
    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement du courrier" />
    } @else if (item(); as courrier) {
      <section class="detail-grid">
        <article class="pd-card">
          <h2>Identification</h2>
          <dl>
            <dt>Numero</dt>
            <dd>{{ courrier.numero }}</dd>
            <dt>Type</dt>
            <dd>{{ typeLabel(courrier.typeCourrier) }}</dd>
            <dt>Sens</dt>
            <dd>{{ courrier.sens === 'ENTRANT' ? 'Entrant' : 'Sortant' }}</dd>
            <dt>Date</dt>
            <dd>{{ courrier.dateArrivee || courrier.dateEmission || '-' }}</dd>
            <dt>Imputation</dt>
            <dd>{{ courrier.imputation }}</dd>
            <dt>Expediteur</dt>
            <dd>{{ courrier.expediteur }}</dd>
          </dl>
        </article>

        <article class="pd-card">
          <h2>Objet et references</h2>
          <dl>
            <dt>Objet</dt>
            <dd>{{ courrier.objet }}</dd>
            <dt>References</dt>
            <dd>{{ courrier.references || '-' }}</dd>
            <dt>Reference depot</dt>
            <dd>{{ courrier.referenceDepot || '-' }}</dd>
          </dl>
        </article>

        @if (courrier.contribuable; as contribuable) {
          <article class="pd-card">
            <h2>Contribuable</h2>
            <dl>
              <dt>Raison sociale</dt>
              <dd>{{ contribuable.raisonSociale }}</dd>
              <dt>NCC</dt>
              <dd>{{ contribuable.ncc || contribuable.nccMasque }}</dd>
              <dt>Lien</dt>
              <dd>
                @if (canLinkContribuable()) {
                  <a class="pd-link" [routerLink]="['/dashboard/contribuables', contribuable.id]">
                    Ouvrir la fiche
                  </a>
                } @else {
                  <span class="pd-muted">Fiche contribuable non accessible.</span>
                }
              </dd>
            </dl>
          </article>
        }

        <article class="pd-card">
          <h2>Rattachement</h2>
          <dl>
            <dt>Demande</dt>
            <dd>
              @if (courrier.demandeId) {
                <span>{{ courrier.demandeId }}</span>
              } @else {
                <span class="pd-muted">Disponible en L11.</span>
              }
            </dd>
            <dt>Statut</dt>
            <dd>{{ courrier.estLie ? 'Lie' : 'Non lie' }}</dd>
          </dl>
        </article>

        @if (canInternal() && (courrier.instructionsDirecteur || courrier.annotationsSdGudef)) {
          <article class="pd-card detail-full">
            <h2>Donnees internes C3</h2>
            <dl>
              @if (courrier.instructionsDirecteur) {
                <dt>Instructions du Directeur</dt>
                <dd>{{ courrier.instructionsDirecteur }}</dd>
              }
              @if (courrier.annotationsSdGudef) {
                <dt>Annotations SD-GUDEF</dt>
                <dd>{{ courrier.annotationsSdGudef }}</dd>
              }
            </dl>
          </article>
        }
      </section>

      <section class="pd-card detail-full">
        <div class="courriers-head">
          <h2>Pieces jointes</h2>
          @if (canUpload()) {
            <label class="pd-btn pd-btn--ghost">
              Ajouter un fichier
              <input type="file" hidden (change)="upload($event)" />
            </label>
          }
        </div>
        @if (attachmentsLoading()) {
          <pdref-state-panel state="loading" title="Chargement des pieces jointes" />
        } @else if (attachments().length === 0) {
          <pdref-state-panel
            state="empty"
            title="Aucune piece jointe"
            message="Aucun fichier rattache."
          />
        } @else {
          <ul class="attachments">
            @for (file of attachments(); track file.id) {
              @if (file.currentFile; as current) {
                <li class="attachment-row">
                  <span>{{ current.originalName }}</span>
                  <button
                    type="button"
                    class="pd-btn pd-btn--ghost pd-btn--sm"
                    (click)="download(current.id)"
                  >
                    Telecharger
                  </button>
                </li>
              }
            }
          </ul>
        }
        @if (message()) {
          <p class="pd-muted" role="status">{{ message() }}</p>
        }
      </section>

      <section class="pd-card">
        <div class="pd-actions">
          @if (canUpdate()) {
            <a
              class="pd-btn pd-btn--ghost"
              [routerLink]="['/dashboard/courriers', courrier.id, 'modifier']"
              >Modifier</a
            >
          }
        </div>
      </section>
    }
  `,
  styleUrl: './courrier-detail-page.component.scss',
})
export class CourrierDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly gateway = inject(CourriersGateway);
  private readonly permissions = inject(PermissionsService);
  private readonly correlation = inject(CorrelationService);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly item = signal<CourrierDetail | null>(null);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly message = signal<string | null>(null);
  readonly attachments = signal<FileGroup[]>([]);
  readonly attachmentsLoading = signal(true);

  constructor() {
    this.load();
  }

  canInternal(): boolean {
    return this.permissions.hasPermission('Courriers_ReadInternal');
  }

  canLinkContribuable(): boolean {
    return this.permissions.hasPermission('Contribuables_Read');
  }

  canUpload(): boolean {
    return this.permissions.hasPermission('Courriers_Create');
  }

  canUpdate(): boolean {
    return this.permissions.hasPermission('Courriers_Update');
  }

  load(): void {
    this.loading.set(true);
    this.gateway.get(this.id).subscribe({
      next: (item) => {
        this.item.set(item);
        this.loading.set(false);
        this.loadAttachments();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  loadAttachments(): void {
    this.attachmentsLoading.set(true);
    this.gateway.attachments(this.id).subscribe({
      next: (items) => {
        this.attachments.set(items);
        this.attachmentsLoading.set(false);
      },
      error: () => this.attachmentsLoading.set(false),
    });
  }

  upload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.gateway.uploadAttachment(this.id, file).subscribe({
      next: (progress) => {
        if (progress >= 100) {
          this.message.set('Piece jointe ajoutee.');
          this.loadAttachments();
        }
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
    input.value = '';
  }

  download(versionId: string): void {
    this.gateway.downloadAttachment(this.id, versionId).subscribe({
      next: ({ blob, fileName }) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName ?? 'courrier';
        anchor.rel = 'noopener';
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  typeLabel(type: string): string {
    return type === 'REPONSE_DGI' ? 'Reponse DGI' : type.charAt(0) + type.slice(1).toLowerCase();
  }
}

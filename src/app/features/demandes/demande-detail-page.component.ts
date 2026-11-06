import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { DemandeDetail } from '../../core/models/demandes/demande.model';
import type { FileGroup } from '../../core/models/files/file.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { DemandesGateway } from '../../core/services/demandes/demandes.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';

const LIGHTHOUSE_DETAIL: DemandeDetail = {
  id: 'lh-demande-1',
  numero: '2026-0001',
  origine: 'AGENT',
  statut: 'EN_CIRCUIT',
  contribuable: {
    id: 'lh-contribuable-1',
    ncc: '1234567A',
    raisonSociale: 'Client demonstration',
    centreImpotId: 'GUDEF',
    centreImpotLibelle: 'GUDEF',
    directionRattachementId: 'DGE',
  },
  dateDepot: '2026-11-05T00:00:00Z',
  exercicePrincipal: 2026,
  etapeCourante: 'CONFORMITE_AUTO',
  createdAt: '2026-11-05T00:00:00Z',
  courrierId: 'lh-courrier-1',
  referenceDepot: 'DEPOT-DEMO',
  exercices: [
    {
      annee: 2026,
      touteLaLiasse: false,
      etatsFinanciers: [{ code: 'BILAN', libelle: 'Bilan' }],
      motifs: [{ code: 'FOND_ERREUR_SAISIE', libelle: 'Erreur de saisie' }],
      variables: [],
    },
  ],
  conformite: {
    statut: 'CONFORME',
    champsManquants: [],
    motifRejetCode: null,
    verifieLe: '2026-11-05T00:00:00Z',
  },
  circuit: {
    code: 'parallele-v1',
    version: 1,
    statut: 'EN_COURS',
    demarreLe: '2026-11-05T00:00:00Z',
    etapeCourante: 'CONFORMITE_AUTO',
    etapes: {
      CONFORMITE_AUTO: {
        statut: 'ACTIVE',
        outcome: null,
        activeLe: '2026-11-05T00:00:00Z',
        echeance: null,
        decideLe: null,
      },
    },
  },
  directionIds: ['GUDEF', 'DGE'],
  updatedAt: null,
  version: 1,
};

@Component({
  selector: 'pdref-demande-detail-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, StatePanelComponent, AbidjanDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header [title]="title()" subtitle="Fiche de demande de rectification." />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Réessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement de la demande" />
    } @else if (item(); as demande) {
      <div class="detail-actions">
        @if (canExport()) {
          <button type="button" class="pd-btn pd-btn--primary" (click)="exportPdf()">
            Exporter en PDF
          </button>
        }
        <a class="pd-btn pd-btn--ghost" routerLink="/dashboard/demandes">Retour à la liste</a>
      </div>

      <nav class="tabs" aria-label="Onglets de la demande">
        @for (tab of tabs; track tab) {
          <button
            type="button"
            class="tabs__item"
            [class.is-active]="activeTab() === tab"
            (click)="activeTab.set(tab)"
          >
            {{ tabLabel(tab) }}
          </button>
        }
      </nav>

      @switch (activeTab()) {
        @case ('synthese') {
          <section class="pd-card detail-grid">
            <div>
              <span class="pd-label">Numéro</span
              ><strong>{{ demande.numero || 'Brouillon' }}</strong>
            </div>
            <div>
              <span class="pd-label">Statut</span><strong>{{ demande.statut }}</strong>
            </div>
            <div>
              <span class="pd-label">Origine</span><strong>{{ demande.origine }}</strong>
            </div>
            <div>
              <span class="pd-label">Déposée le</span
              ><strong>{{ demande.dateDepot | abidjanDate }}</strong>
            </div>
            <div>
              <span class="pd-label">NCC</span><strong>{{ demande.contribuable.ncc }}</strong>
            </div>
            <div>
              <span class="pd-label">Raison sociale</span
              ><strong>{{ demande.contribuable.raisonSociale }}</strong>
            </div>
            <div>
              <span class="pd-label">Centre</span
              ><strong>{{
                demande.contribuable.centreImpotLibelle || demande.contribuable.centreImpotId
              }}</strong>
            </div>
            <div>
              <span class="pd-label">Direction</span
              ><strong>{{ demande.contribuable.directionRattachementId }}</strong>
            </div>
            <div>
              <span class="pd-label">Référence dépôt</span
              ><strong>{{ demande.referenceDepot || '-' }}</strong>
            </div>
            <div>
              <span class="pd-label">Courrier</span><strong>{{ demande.courrierId || '-' }}</strong>
            </div>
          </section>
        }

        @case ('exercices') {
          <section class="pd-card">
            @for (exercise of demande.exercices; track exercise.annee) {
              <article class="exercise-detail">
                <h3>Exercice {{ exercise.annee }}</h3>
                <p>
                  <strong>Périmètre :</strong>
                  {{ exercise.touteLaLiasse ? 'Toute la liasse' : 'États sélectionnés' }}
                </p>
                <p><strong>États :</strong> {{ labels(exercise.etatsFinanciers) }}</p>
                <p><strong>Motifs :</strong> {{ motives(exercise.motifs) }}</p>
                @if (exercise.variables.length > 0) {
                  <table class="pd-table">
                    <thead>
                      <tr>
                        <th>Variable</th>
                        <th>Type</th>
                        <th>Valeur</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (variable of exercise.variables; track variable.code) {
                        <tr>
                          <td>{{ variable.libelle }}</td>
                          <td>{{ variable.type }}</td>
                          <td>
                            {{ variable.type === 'MONTANT' ? variable.montant : variable.texte }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </article>
            }
          </section>
        }

        @case ('conformite') {
          <section class="pd-card">
            <p><span class="pd-label">Statut</span> {{ demande.conformite.statut }}</p>
            @if (demande.conformite.motifRejetCode) {
              <p class="pd-error">Motif de rejet : {{ demande.conformite.motifRejetCode }}</p>
            }
            @if (demande.conformite.champsManquants.length > 0) {
              <p>Champs manquants : {{ demande.conformite.champsManquants.join(', ') }}</p>
            }
            <p class="pd-muted">Vérifiée le {{ demande.conformite.verifieLe | abidjanDate }}</p>
          </section>
        }

        @case ('circuit') {
          <section class="pd-card">
            @if (demande.circuit; as circuit) {
              <p>
                <strong>{{ circuit.code }}</strong> v{{ circuit.version }} — {{ circuit.statut }}
              </p>
              <p>Étape courante : {{ circuit.etapeCourante || '-' }}</p>
              <div class="table-wrap">
                <table class="pd-table">
                  <thead>
                    <tr>
                      <th>Étape</th>
                      <th>Statut</th>
                      <th>Échéance</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (step of circuitEntries(demande); track step[0]) {
                      <tr>
                        <td>{{ step[0] }}</td>
                        <td>{{ step[1].statut }}</td>
                        <td>{{ step[1].echeance | abidjanDate }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <pdref-state-panel
                state="empty"
                title="Circuit non activé"
                message="Le circuit n'a pas été activé pour cette demande."
              />
            }
          </section>
        }

        @case ('pieces') {
          <section class="pd-card">
            <div class="section-head">
              <h2>Pièces jointes</h2>
              @if (canUpload()) {
                <label class="pd-btn pd-btn--primary pd-btn--sm">
                  Ajouter un PDF
                  <input type="file" accept="application/pdf" hidden (change)="upload($event)" />
                </label>
              }
            </div>
            @if (attachmentsLoading()) {
              <pdref-state-panel state="loading" title="Chargement des pièces jointes" />
            } @else if (attachments().length === 0) {
              <pdref-state-panel
                state="empty"
                title="Aucune pièce jointe"
                message="Ajoutez au moins un PDF."
              />
            } @else {
              <ul class="attachments">
                @for (group of attachments(); track group.id) {
                  @if (group.currentFile; as file) {
                    <li>
                      <span>{{ file.originalName }}</span>
                      <button
                        type="button"
                        class="pd-btn pd-btn--ghost pd-btn--sm"
                        (click)="download(file.id)"
                      >
                        Télécharger
                      </button>
                    </li>
                  }
                }
              </ul>
            }
          </section>
        }
      }
    }
  `,
  styleUrl: './demandes-page.component.scss',
})
export class DemandeDetailPageComponent {
  private readonly gateway = inject(DemandesGateway);
  private readonly route = inject(ActivatedRoute);
  private readonly permissions = inject(PermissionsService);
  private readonly correlation = inject(CorrelationService);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly tabs = ['synthese', 'exercices', 'conformite', 'circuit', 'pieces'] as const;
  readonly activeTab = signal<(typeof this.tabs)[number]>('synthese');
  readonly item = signal<DemandeDetail | null>(null);
  readonly attachments = signal<FileGroup[]>([]);
  readonly loading = signal(true);
  readonly attachmentsLoading = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);

  constructor() {
    if (isLighthouseEnabled()) {
      this.item.set(LIGHTHOUSE_DETAIL);
      this.loading.set(false);
      return;
    }
    this.load();
  }

  title(): string {
    const item = this.item();
    return item?.numero ? `Demande ${item.numero}` : 'Demande';
  }

  canExport(): boolean {
    return this.permissions.hasPermission('Demandes_Export');
  }

  canUpload(): boolean {
    return this.permissions.hasPermission('Demandes_Create');
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
          this.loadAttachments();
        }
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
    input.value = '';
  }

  download(versionId: string): void {
    this.gateway.downloadAttachment(this.id, versionId).subscribe({
      next: ({ blob, fileName }) => this.saveBlob(blob, fileName ?? 'piece-jointe'),
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  exportPdf(): void {
    this.gateway.export(this.id).subscribe({
      next: ({ blob, fileName }) => this.saveBlob(blob, fileName ?? 'demande.pdf'),
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  labels(items: ReadonlyArray<{ libelle: string }>): string {
    return items.length === 0 ? '-' : items.map((item) => item.libelle).join(', ');
  }

  motives(items: ReadonlyArray<{ libelle: string; precision?: string | null }>): string {
    return items.length === 0
      ? '-'
      : items
          .map((item) => (item.precision ? `${item.libelle} (${item.precision})` : item.libelle))
          .join(', ');
  }

  circuitEntries(
    demande: DemandeDetail,
  ): Array<[string, { statut: string; echeance: string | null }]> {
    return Object.entries(demande.circuit?.etapes ?? {});
  }

  tabLabel(tab: string): string {
    return (
      {
        synthese: 'Synthèse',
        exercices: 'Exercices',
        conformite: 'Conformité',
        circuit: 'Circuit',
        pieces: 'Pièces jointes',
      }[tab] ?? tab
    );
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

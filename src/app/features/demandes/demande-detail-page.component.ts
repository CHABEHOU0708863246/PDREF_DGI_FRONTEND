import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { DemandeDetail } from '../../core/models/demandes/demande.model';
import type { SuiviDetail } from '../../core/models/suivis/suivi.model';
import type { FileGroup } from '../../core/models/files/file.model';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { SidePanelComponent } from '../../core/components/side-panel/side-panel.component';
import {
  RejetDialogComponent,
  type RejetDialogValue,
} from '../../core/components/rejet-dialog/rejet-dialog.component';
import type { RejetMotif } from '../../core/models/rejets/rejet.model';
import { RejetGateway } from '../../core/services/rejets/rejet.gateway';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { DemandesGateway } from '../../core/services/demandes/demandes.gateway';
import { SuivisGateway } from '../../core/services/suivis/suivis.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { isLighthouseEnabled } from '../../core/utils/lighthouse';
import { normalizeProblem } from '../../core/utils/problem';
import {
  avisStatutLabel,
  circuitStatutLabel,
  decisionLabel,
  demandeStatutLabel,
  etapeLabel,
  etapeStatutLabel,
} from '../../core/utils/labels';

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
  pdfManquant: false,
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

const LIGHTHOUSE_SUIVI: SuiviDetail = {
  id: 'lh-suivi-1',
  demandeId: 'lh-demande-1',
  numero: '2026-0001',
  cycle: 1,
  contribuable: { ncc: '1234567A', raisonSociale: 'Client demonstration' },
  statut: 'AVIS_COMPLET',
  avisRecus: 3,
  avisTotal: 3,
  avisFavorables: 2,
  avisNonFavorables: 1,
  transmissionsCount: 1,
  etapeCourante: 'VALIDATION_GLOBALE_GUDEF',
  demandeStatut: 'EN_CIRCUIT',
  dateDepot: '2026-11-05T00:00:00Z',
  dateOuverture: '2026-11-05T00:00:00Z',
  dateCloture: null,
  avis: [
    {
      id: 'lh-avis-1',
      etapeCode: 'AVIS_DERAR',
      directionId: 'DERAR',
      directionCode: 'DERAR',
      statut: 'EMIS',
      decision: 'FAVORABLE',
      motifCode: null,
      commentaire: null,
      article24: {
        insuffisanceMemeNature3Ans: false,
        engagementRedressementEnCours: false,
        avisVerificationComptabilite: false,
        verificationApprofondieEnCours: null,
      },
      emisLe: '2026-11-05T00:00:00Z',
      emisPar: 'lh-user-1',
      echeance: null,
    },
    {
      id: 'lh-avis-2',
      etapeCode: 'AVIS_DVFN',
      directionId: 'DVFN',
      directionCode: 'DVFN',
      statut: 'EMIS',
      decision: 'FAVORABLE',
      motifCode: null,
      commentaire: null,
      article24: {
        insuffisanceMemeNature3Ans: false,
        engagementRedressementEnCours: false,
        avisVerificationComptabilite: false,
        verificationApprofondieEnCours: null,
      },
      emisLe: '2026-11-05T00:00:00Z',
      emisPar: 'lh-user-2',
      echeance: null,
    },
    {
      id: 'lh-avis-3',
      etapeCode: 'AVIS_RATTACHEMENT',
      directionId: 'DGE',
      directionCode: 'DGE',
      statut: 'EMIS',
      decision: 'NON_FAVORABLE',
      motifCode: 'VERIFICATION_APPROFONDIE_EN_COURS',
      commentaire: 'Verification en cours',
      article24: {
        insuffisanceMemeNature3Ans: false,
        engagementRedressementEnCours: false,
        avisVerificationComptabilite: false,
        verificationApprofondieEnCours: true,
      },
      emisLe: '2026-11-05T00:00:00Z',
      emisPar: 'lh-user-3',
      echeance: null,
    },
  ],
  validationGlobale: null,
  corrections: [],
  transmissions: [],
  directionIds: ['GUDEF', 'DGE'],
  etapes: [],
};

@Component({
  selector: 'pdref-demande-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    SidePanelComponent,
    StatePanelComponent,
    AbidjanDatePipe,
    RejetDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-side-panel [open]="true" [title]="title()" size="xl" (closeRequested)="close()">
      @if (problem(); as issue) {
        <pdref-state-panel
          state="error"
          [problem]="issue"
          actionLabel="Réessayer"
          (retry)="load()"
        />
      } @else if (loading()) {
        <pdref-state-panel state="loading" title="Chargement de la demande" />
      } @else if (item(); as demande) {
        <div class="detail-actions">
          @if (canVerify()) {
            <button type="button" class="pd-btn pd-btn--primary" (click)="verify()">
              Vérifier GUDEF
            </button>
          }
          @if (canReject()) {
            <button type="button" class="pd-btn pd-btn--danger" (click)="openRejet()">
              Rejeter
            </button>
          }
          @if (canModify()) {
            <a
              class="pd-btn pd-btn--ghost"
              [routerLink]="['/dashboard/demandes', demande.id, 'modifier']"
            >
              Modifier
            </a>
          }
          @if (canDeposit()) {
            <button
              type="button"
              class="pd-btn pd-btn--primary"
              [disabled]="depositing()"
              (click)="deposer()"
            >
              {{ depositing() ? 'Depot...' : 'Deposer la demande' }}
            </button>
          }
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
                <span class="pd-label">Statut</span
                ><strong>{{ demandeStatutLabel(demande.statut) }}</strong>
                @if (demande.pdfManquant) {
                  <span class="pd-chip pd-chip--danger">PDF a joindre</span>
                }
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
                ><strong>{{ demande.contribuable.centreImpotLibelle || '-' }}</strong>
              </div>
              <div>
                <span class="pd-label">Direction</span
                ><strong>{{
                  demande.contribuable.directionLibelle ||
                    demande.contribuable.centreImpotLibelle ||
                    '-'
                }}</strong>
              </div>
              <div>
                <span class="pd-label">Référence dépôt</span
                ><strong>{{ demande.referenceDepot || '-' }}</strong>
              </div>
              <div>
                <span class="pd-label">Courrier</span
                ><strong>{{ demande.courrierNumero || demande.referenceDepot || '-' }}</strong>
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
                  Circuit : <strong>{{ circuitStatutLabel(circuit.statut) }}</strong
                  >&nbsp;<span class="pd-muted"
                    >({{ circuit.code }}, version {{ circuit.version }})</span
                  >
                </p>
                <p>Étape courante : {{ etapeLabel(circuit.etapeCourante) }}</p>
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
                          <td>{{ etapeLabel(step[0]) }}</td>
                          <td>{{ etapeStatutLabel(step[1].statut) }}</td>
                          <td>{{ step[1].echeance | abidjanDate }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
                @if (suivi(); as dossier) {
                  <div class="section-head">
                    <h3>Avis des directions</h3>
                    <a class="pd-link" [routerLink]="['/dashboard/suivis', dossier.demandeId]">
                      Ouvrir le suivi
                    </a>
                  </div>
                  <div class="avis-grid">
                    @for (avis of dossier.avis; track avis.id) {
                      <article class="avis-card">
                        <strong>{{ etapeLabel(avis.etapeCode) }}</strong>
                        <span class="pd-chip">{{ avisStatutLabel(avis.statut) }}</span>
                        <span>{{ decisionLabel(avis.decision, 'Décision en attente') }}</span>
                        <span class="pd-muted">{{ avis.directionCode }}</span>
                      </article>
                    }
                  </div>
                }
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
    </pdref-side-panel>

    <pdref-rejet-dialog
      [(open)]="rejetOpen"
      [motifs]="rejetMotifs()"
      [busy]="rejetBusy()"
      (confirmed)="confirmerRejet($event)"
    />
  `,
  styleUrl: './demandes-page.component.scss',
})
export class DemandeDetailPageComponent {
  readonly demandeStatutLabel = demandeStatutLabel;
  readonly etapeLabel = etapeLabel;
  readonly etapeStatutLabel = etapeStatutLabel;
  readonly avisStatutLabel = avisStatutLabel;
  readonly circuitStatutLabel = circuitStatutLabel;
  readonly decisionLabel = decisionLabel;
  private readonly gateway = inject(DemandesGateway);
  private readonly suivisGateway = inject(SuivisGateway);
  private readonly rejets = inject(RejetGateway);
  private readonly router = inject(Router);

  private readonly route = inject(ActivatedRoute);
  private readonly permissions = inject(PermissionsService);
  private readonly correlation = inject(CorrelationService);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly tabs = ['synthese', 'exercices', 'conformite', 'circuit', 'pieces'] as const;
  readonly activeTab = signal<(typeof this.tabs)[number]>(
    isLighthouseEnabled() ? 'circuit' : 'synthese',
  );
  readonly item = signal<DemandeDetail | null>(null);
  readonly suivi = signal<SuiviDetail | null>(null);
  readonly attachments = signal<FileGroup[]>([]);
  readonly loading = signal(true);
  readonly attachmentsLoading = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly rejetOpen = signal(false);
  readonly depositing = signal(false);
  readonly rejetMotifs = signal<readonly RejetMotif[]>([]);
  readonly rejetBusy = signal(false);

  constructor() {
    if (isLighthouseEnabled()) {
      this.item.set(LIGHTHOUSE_DETAIL);
      this.suivi.set(LIGHTHOUSE_SUIVI);
      this.loading.set(false);
      return;
    }
    this.load();
  }

  title(): string {
    const item = this.item();
    return item?.numero ? `Demande ${item.numero}` : 'Demande';
  }

  canVerify(): boolean {
    return (
      this.permissions.hasPermission('Etapes_Verifier_Gudef') &&
      ['VERIF_GUDEF', 'CONFORMITE_AUTO'].includes(this.item()?.etapeCourante ?? '')
    );
  }

  canReject(): boolean {
    const item = this.item();
    const assignee = item?.circuit?.etapes?.['VERIF_GUDEF']?.assigneeUserId;
    return (
      ['VERIF_GUDEF', 'CONFORMITE_AUTO'].includes(item?.etapeCourante ?? '') &&
      this.permissions.hasPermission('Rejets_Create') &&
      (this.permissions.hasRole('SD_GUDEF') || assignee === this.permissions.currentUserId())
    );
  }

  openRejet(): void {
    this.rejets.motifs().subscribe({
      next: (items) => {
        this.rejetMotifs.set(items);
        this.rejetOpen.set(true);
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  confirmerRejet(value: RejetDialogValue): void {
    this.rejetBusy.set(true);
    this.rejets.create(this.id, value).subscribe({
      next: (item) => {
        this.rejetBusy.set(false);
        this.rejetOpen.set(false);
        void this.router.navigate(['/dashboard/rejets', item.id]);
      },
      error: (error: unknown) => {
        this.rejetBusy.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  verify(): void {
    this.suivisGateway.verifierGudef(this.id).subscribe({
      next: () => {
        this.load();
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  canExport(): boolean {
    return this.permissions.hasPermission('Demandes_Export');
  }

  canUpload(): boolean {
    return this.permissions.hasPermission('Demandes_Create');
  }

  canModify(): boolean {
    return this.permissions.hasPermission('Demandes_Update') && this.item()?.statut === 'REJETEE';
  }

  canDeposit(): boolean {
    const demande = this.item();
    return (
      this.permissions.hasPermission('Demandes_Update') &&
      demande?.statut === 'BROUILLON' &&
      !demande.pdfManquant
    );
  }

  deposer(): void {
    const demande = this.item();
    if (!demande || this.depositing()) {
      return;
    }

    this.depositing.set(true);
    this.problem.set(null);
    this.gateway
      .update(
        demande.id,
        {
          contribuableId: demande.contribuable.id,
          ncc: demande.contribuable.ncc,
          referenceDepot: demande.referenceDepot,
          brouillon: false,
          deposer: true,
          exercices: demande.exercices.map((exercice) => ({
            annee: exercice.annee,
            touteLaLiasse: exercice.touteLaLiasse,
            etatsFinanciers: exercice.etatsFinanciers.map((etat) => etat.code),
            motifs: exercice.motifs.map((motif) => ({
              code: motif.code,
              precision: motif.precision ?? null,
            })),
            variables: exercice.variables.map((variable) => ({
              code: variable.code,
              libelle: variable.libelle,
              type: variable.type,
              montant: variable.montant ?? null,
              texte: variable.texte ?? null,
            })),
          })),
        },
        demande.version,
      )
      .subscribe({
        next: () => {
          this.depositing.set(false);
          this.load();
        },
        error: (error: unknown) => {
          this.depositing.set(false);
          this.problem.set(normalizeProblem(error, this.correlation.last));
        },
      });
  }

  close(): void {
    void this.router.navigate(['/dashboard/demandes']);
  }

  load(): void {
    this.loading.set(true);
    this.gateway.get(this.id).subscribe({
      next: (item) => {
        this.item.set(item);
        this.loading.set(false);
        this.loadAttachments();
        this.loadSuivi();
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

  loadSuivi(): void {
    if (!this.permissions.hasPermission('Suivis_Read')) {
      return;
    }
    this.suivisGateway.get(this.id).subscribe({
      next: (item) => this.suivi.set(item),
      error: () => this.suivi.set(null),
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
          this.load();
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

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { CourrierDetail } from '../../core/models/courriers/courrier.model';
import type { FileGroup } from '../../core/models/files/file.model';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { SidePanelComponent } from '../../core/components/side-panel/side-panel.component';
import type { IntegrationModes } from '../../core/models/integrations/integration.model';
import { CourriersGateway } from '../../core/services/courriers/courriers.gateway';
import { IntegrationGateway } from '../../core/services/integrations/integration.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-courrier-detail-page',
  standalone: true,
  imports: [RouterLink, SidePanelComponent, StatePanelComponent, AbidjanDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-side-panel
      [open]="true"
      [title]="'Fiche courrier ' + (item()?.numero || '')"
      size="lg"
      (closeRequested)="close()"
    >
      @if (problem(); as issue) {
        <pdref-state-panel
          state="error"
          [problem]="issue"
          actionLabel="Réessayer"
          (retry)="load()"
        />
      } @else if (loading()) {
        <pdref-state-panel state="loading" title="Chargement du courrier" />
      } @else if (item(); as courrier) {
        <section class="detail-grid">
          <article class="pd-card">
            <h2>Identification</h2>
            <dl>
              <dt>Numéro</dt>
              <dd>{{ courrier.numero }}</dd>
              <dt>Type</dt>
              <dd>{{ typeLabel(courrier.typeCourrier) }}</dd>
              <dt>Sens</dt>
              <dd>{{ courrier.sens === 'ENTRANT' ? 'Entrant' : 'Sortant' }}</dd>
              <dt>Date</dt>
              <dd>
                {{
                  courrier.dateArrivee || courrier.dateEmission
                    ? (courrier.dateArrivee || courrier.dateEmission | abidjanDate)
                    : '-'
                }}
              </dd>
              <dt>Imputation</dt>
              <dd>{{ courrier.imputation }}</dd>
              <dt>Expéditeur</dt>
              <dd>{{ courrier.expediteur }}</dd>
            </dl>
          </article>

          <article class="pd-card">
            <h2>Objet et références</h2>
            <dl>
              <dt>Objet</dt>
              <dd>{{ courrier.objet }}</dd>
              <dt>Références</dt>
              <dd>{{ courrier.references || '-' }}</dd>
              <dt>Référence dépôt</dt>
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
                  <span>{{ courrier.referenceDepot || 'Dossier lié' }}</span>
                } @else {
                  <span class="pd-muted">Disponible.</span>
                }
              </dd>
              <dt>Statut</dt>
              <dd>{{ courrier.estLie ? 'Lié' : 'Non lié' }}</dd>
            </dl>
          </article>

          @if (canInternal() && (courrier.instructionsDirecteur || courrier.annotationsSdGudef)) {
            <article class="pd-card detail-full">
              <h2>Données internes C3</h2>
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

        @if (manualSignature()) {
          <p><span class="pd-chip">Mode manuel</span></p>
        }
        @if (canSigner() && manualSignature()) {
          <section class="pd-card">
            <h2>Déposer le courrier signé</h2>
            <label class="pd-field">
              <span class="pd-label">Signataire déclaré</span>
              <input class="pd-input" [value]="signataire()" (input)="onSignataire($event)" />
            </label>
            <label class="pd-field">
              <span class="pd-label">Date de signature</span>
              <input
                class="pd-input"
                type="date"
                [value]="dateSignature()"
                (input)="onDateSignature($event)"
              />
            </label>
            <label class="pd-btn pd-btn--ghost">
              Choisir le PDF signé
              <input type="file" accept="application/pdf" hidden (change)="signer($event)" />
            </label>
          </section>
        }
        @if (canDeclarerRemise()) {
          <section class="pd-card">
            <h2>Déclarer la remise</h2>
            <label class="pd-field">
              <span class="pd-label">Canal</span>
              <select class="pd-input" [value]="canal()" (change)="onCanal($event)">
                <option value="DEPOT_EIMPOTS_MANUEL">Dépôt au guichet</option>
                <option value="REMISE_PAPIER">Remise papier</option>
              </select>
            </label>
            <label class="pd-field">
              <span class="pd-label">Date de remise</span>
              <input
                class="pd-input"
                type="date"
                [value]="dateRemise()"
                (input)="onDateRemise($event)"
              />
            </label>
            <label class="pd-field">
              <span class="pd-label">Référence</span>
              <input
                class="pd-input"
                [value]="referenceRemise()"
                (input)="onReferenceRemise($event)"
              />
              <span class="pd-help">Référence proposée automatiquement, modifiable.</span>
            </label>
            <button type="button" class="pd-btn pd-btn--primary" (click)="declarerRemise()">
              Déclarer la remise
            </button>
          </section>
        }

        <section class="pd-card detail-full">
          <div class="courriers-head">
            <h2>Pièces jointes</h2>
            @if (canUpload()) {
              <label class="pd-btn pd-btn--ghost">
                Ajouter un fichier
                <input type="file" hidden (change)="upload($event)" />
              </label>
            }
          </div>
          @if (attachmentsLoading()) {
            <pdref-state-panel state="loading" title="Chargement des pièces jointes" />
          } @else if (attachments().length === 0) {
            <pdref-state-panel
              state="empty"
              title="Aucune pièce jointe"
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
                      Télécharger
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
            <button type="button" class="pd-btn pd-btn--ghost" (click)="exportFiche()">
              Fiche PDF
            </button>
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
    </pdref-side-panel>
  `,
  styleUrl: './courrier-detail-page.component.scss',
})
export class CourrierDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly gateway = inject(CourriersGateway);
  private readonly integrations = inject(IntegrationGateway);
  private readonly permissions = inject(PermissionsService);
  private readonly correlation = inject(CorrelationService);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly item = signal<CourrierDetail | null>(null);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly message = signal<string | null>(null);
  readonly attachments = signal<FileGroup[]>([]);
  readonly attachmentsLoading = signal(true);
  readonly modes = signal<IntegrationModes | null>(null);
  readonly signataire = signal('');
  readonly dateSignature = signal(today());
  readonly canal = signal('DEPOT_EIMPOTS_MANUEL');
  readonly dateRemise = signal(today());
  readonly referenceRemise = signal('');

  constructor() {
    this.load();
    this.integrations.modes().subscribe({ next: (modes) => this.modes.set(modes) });
  }

  manualSignature(): boolean {
    return this.modes()?.signature === 'MANUEL';
  }

  canSigner(): boolean {
    return this.permissions.hasPermission('Courriers_DeposerSigne');
  }

  onSignataire(event: Event): void {
    this.signataire.set((event.target as HTMLInputElement).value);
  }

  onDateSignature(event: Event): void {
    this.dateSignature.set((event.target as HTMLInputElement).value);
  }

  onCanal(event: Event): void {
    this.canal.set((event.target as HTMLSelectElement).value);
  }

  onDateRemise(event: Event): void {
    this.dateRemise.set((event.target as HTMLInputElement).value);
  }

  onReferenceRemise(event: Event): void {
    this.referenceRemise.set((event.target as HTMLInputElement).value);
  }

  signer(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.gateway.signerManuel(this.id, file, this.signataire(), this.dateSignature()).subscribe({
      next: () => {
        this.load();
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
    input.value = '';
  }

  declarerRemise(): void {
    this.gateway
      .declarerRemise(this.id, this.canal(), this.dateRemise(), this.referenceRemise())
      .subscribe({
        next: () => {
          this.load();
        },
        error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
      });
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

  canDeclarerRemise(): boolean {
    return (
      this.permissions.hasPermission('Courriers_Update') && this.permissions.hasRole('SD_GUDEF')
    );
  }

  close(): void {
    void this.router.navigate(['/dashboard/courriers']);
  }

  load(): void {
    this.loading.set(true);
    this.gateway.get(this.id).subscribe({
      next: (item) => {
        this.item.set(item);
        this.loading.set(false);
        this.loadAttachments();
        this.loadRemiseReference();
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

  loadRemiseReference(): void {
    // Seul le profil autorise a declarer la remise (SD GUDEF) peut obtenir la reference.
    if (
      !this.canDeclarerRemise() ||
      this.item()?.remiseStatut === 'REMIS' ||
      this.referenceRemise()
    ) {
      return;
    }
    this.gateway.remiseReference(this.id).subscribe({
      next: (reference) => {
        if (!this.referenceRemise()) {
          this.referenceRemise.set(reference);
        }
      },
      error: () => {
        // La reference reste vide : le backend la generera a la declaration.
      },
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

  exportFiche(): void {
    this.gateway.fichePdf(this.id).subscribe({
      next: ({ blob, fileName }) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName ?? `courrier-${this.id}.pdf`;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
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

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

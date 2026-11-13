import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { CtfDetail } from '../../core/models/ctf/ctf.model';
import type { IntegrationModes } from '../../core/models/integrations/integration.model';
import { SidePanelComponent } from '../../core/components/side-panel/side-panel.component';
import { UploadFieldComponent } from '../../core/components/upload-field/upload-field.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { CtfGateway } from '../../core/services/ctf/ctf.gateway';
import { FilesGateway } from '../../core/services/files/files.gateway';
import { IntegrationGateway } from '../../core/services/integrations/integration.gateway';
import { normalizeProblem } from '../../core/utils/problem';
import { ctfStatutLabel } from './ctf-status';

@Component({
  selector: 'pdref-ctf-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    SidePanelComponent,
    StatePanelComponent,
    AbidjanDatePipe,
    UploadFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-side-panel
      [open]="true"
      [title]="'CTF - ' + (item()?.numeroDemande || '')"
      size="lg"
      (closeRequested)="close()"
    >
      @if (problem(); as issue) {
        <pdref-state-panel
          state="error"
          [problem]="issue"
          actionLabel="Reessayer"
          (retry)="load()"
        />
      } @else if (loading()) {
        <pdref-state-panel state="loading" title="Chargement de l'autorisation CTF" />
      } @else if (item(); as detail) {
        @if (manualEImpots()) {
          <p><span class="pd-chip">Mode manuel</span></p>
        }
        <div class="actions">
          @if (canActiver() && detail.statut === 'A_ACTIVER') {
            @if (manualEImpots()) {
              <label class="pd-field">
                <span class="pd-label">Reference e-impots</span>
                <input class="pd-input" [value]="reference()" (input)="onReference($event)" />
              </label>
              <label class="pd-field">
                <span class="pd-label">Date d'activation</span>
                <input
                  class="pd-input"
                  type="date"
                  [value]="dateActivation()"
                  (input)="onDateActivation($event)"
                />
              </label>
              <pdref-upload-field
                label="Preuve d'activation (facultatif)"
                hint="PDF, PNG ou JPEG, 5 Mo maximum."
                accept=".pdf,image/png,image/jpeg"
                [multiple]="false"
                [maxFiles]="1"
                (filesSelected)="onProofSelected($event)"
              />
              @if (proofName(); as name) {
                <p class="pd-muted">Preuve selectionnee : {{ name }}</p>
              }
              <button
                type="button"
                class="pd-btn pd-btn--primary"
                [disabled]="busy() || uploadingProof()"
                (click)="declarerActivation()"
              >
                Declarer l'activation
              </button>
            } @else {
              <button
                type="button"
                class="pd-btn pd-btn--primary"
                [disabled]="busy()"
                (click)="activer()"
              >
                Activer
              </button>
            }
          }
          @if (
            canActiver() &&
            manualEImpots() &&
            detail.statut !== 'A_ACTIVER' &&
            detail.dateRetourGudef &&
            !detail.dateDepotRectifie
          ) {
            <label class="pd-field">
              <span class="pd-label">Reference depot rectifie</span>
              <input
                class="pd-input"
                [value]="referenceDepot()"
                (input)="onReferenceDepot($event)"
              />
            </label>
            <label class="pd-field">
              <span class="pd-label">Date du depot</span>
              <input
                class="pd-input"
                type="date"
                [value]="dateDepot()"
                (input)="onDateDepot($event)"
              />
            </label>
            <button
              type="button"
              class="pd-btn pd-btn--primary"
              [disabled]="busy()"
              (click)="declarerDepot()"
            >
              Declarer le depot rectifie
            </button>
          }
          @if (
            canRetour() && (detail.statut === 'ACTIVEE' || detail.statut === 'CONTRIBUABLE_INFORME')
          ) {
            <button
              type="button"
              class="pd-btn pd-btn--ghost"
              [disabled]="busy()"
              (click)="retour()"
            >
              Retour GUDEF
            </button>
          }
          <a class="pd-btn pd-btn--ghost" routerLink="/dashboard/ctf/suivi">Retour au suivi</a>
        </div>

        <section class="pd-card summary">
          <div>
            <span class="pd-label">Demande</span><strong>{{ detail.numeroDemande }}</strong>
          </div>
          <div>
            <span class="pd-label">Contribuable</span><strong>{{ detail.raisonSociale }}</strong>
          </div>
          <div>
            <span class="pd-label">NCC</span><strong>{{ detail.ncc }}</strong>
          </div>
          <div>
            <span class="pd-label">Cycle</span><strong>{{ detail.cycle }}</strong>
          </div>
          <div>
            <span class="pd-label">Statut</span><strong>{{ statutLabel(detail.statut) }}</strong>
          </div>
          <div>
            <span class="pd-label">Activation</span
            ><strong>{{ detail.echeanceActivation | abidjanDate }}</strong>
          </div>
          <div>
            <span class="pd-label">Depot</span
            ><strong>{{ detail.echeanceDepot | abidjanDate }}</strong>
          </div>
          <div>
            <span class="pd-label">Delai depot</span
            ><strong>{{ detail.joursRestantsDepot }} JO</strong>
          </div>
          <div>
            <span class="pd-label">Courrier</span><strong>{{ detail.courrierId }}</strong>
          </div>
          <div>
            <span class="pd-label">Reference activation</span
            ><strong>{{ detail.referenceActivation || '-' }}</strong>
          </div>
          <div>
            <span class="pd-label">Retour GUDEF</span
            ><strong>{{ detail.dateRetourGudef | abidjanDate }}</strong>
          </div>
          <div>
            <span class="pd-label">Cloture</span
            ><strong>{{ detail.dateCloture | abidjanDate }}</strong>
          </div>
          <div>
            <span class="pd-label">Motif</span><strong>{{ detail.motifCloture || '-' }}</strong>
          </div>
          <div>
            <span class="pd-label">Tentatives</span><strong>{{ detail.tentatives }}</strong>
          </div>
        </section>

        @if (detail.derniereErreur) {
          <section class="pd-card">
            <h2>Derniere erreur</h2>
            <p class="pd-error">{{ detail.derniereErreur }}</p>
          </section>
        }
      }
    </pdref-side-panel>
  `,
  styles: [
    `
      .actions,
      .summary {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: end;
      }
      .actions {
        margin-bottom: 1rem;
      }
      .summary > div {
        display: grid;
        min-width: 11rem;
      }
    `,
  ],
})
export class CtfDetailPageComponent {
  private readonly gateway = inject(CtfGateway);
  private readonly integrations = inject(IntegrationGateway);
  private readonly files = inject(FilesGateway);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionsService);
  private readonly demandeId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly item = signal<CtfDetail | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly modes = signal<IntegrationModes | null>(null);
  readonly reference = signal('');
  readonly referenceDepot = signal('');
  readonly dateActivation = signal(today());
  readonly dateDepot = signal(today());
  readonly proofVersionId = signal<string | null>(null);
  readonly proofName = signal<string | null>(null);
  readonly uploadingProof = signal(false);

  constructor() {
    this.load();
    this.integrations.modes().subscribe({ next: (modes) => this.modes.set(modes) });
  }

  manualEImpots(): boolean {
    return this.modes()?.eImpots === 'MANUEL';
  }

  close(): void {
    void this.router.navigate(['/dashboard/ctf/suivi']);
  }

  load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.get(this.demandeId).subscribe({
      next: (item) => {
        this.item.set(item);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  canActiver(): boolean {
    return this.permissions.hasPermission('Ctf_Activer');
  }

  canRetour(): boolean {
    return this.permissions.hasPermission('Ctf_Retour');
  }

  onReference(event: Event): void {
    this.reference.set((event.target as HTMLInputElement).value);
  }

  onReferenceDepot(event: Event): void {
    this.referenceDepot.set((event.target as HTMLInputElement).value);
  }

  onDateActivation(event: Event): void {
    this.dateActivation.set((event.target as HTMLInputElement).value);
  }

  onDateDepot(event: Event): void {
    this.dateDepot.set((event.target as HTMLInputElement).value);
  }

  onProofSelected(files: readonly File[]): void {
    const file = files[0];
    if (!file) {
      this.proofVersionId.set(null);
      this.proofName.set(null);
      return;
    }

    this.uploadingProof.set(true);
    this.files.uploadGroup(file, 'CTF', this.demandeId).subscribe({
      next: (group) => {
        this.uploadingProof.set(false);
        this.proofVersionId.set(group.currentFile?.id ?? null);
        this.proofName.set(file.name);
      },
      error: (error: unknown) => {
        this.uploadingProof.set(false);
        this.proofVersionId.set(null);
        this.proofName.set(null);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  declarerActivation(): void {
    if (this.busy() || this.uploadingProof()) {
      return;
    }
    this.busy.set(true);
    this.gateway
      .activationManuelle(this.demandeId, {
        reference: this.reference(),
        dateActivation: this.dateActivation(),
        preuveVersionId: this.proofVersionId(),
      })
      .subscribe({
        next: (item) => {
          this.busy.set(false);
          this.item.set(item);
        },
        error: (error: unknown) => {
          this.busy.set(false);
          this.problem.set(normalizeProblem(error, null));
        },
      });
  }

  declarerDepot(): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.gateway
      .depotRectifieManuel(this.demandeId, {
        reference: this.referenceDepot(),
        dateDepot: this.dateDepot(),
      })
      .subscribe({
        next: (item) => {
          this.busy.set(false);
          this.item.set(item);
        },
        error: (error: unknown) => {
          this.busy.set(false);
          this.problem.set(normalizeProblem(error, null));
        },
      });
  }

  activer(): void {
    if (this.busy() || !this.canActiver()) {
      return;
    }

    this.busy.set(true);
    this.gateway.activer(this.demandeId).subscribe({
      next: (item) => {
        this.busy.set(false);
        this.item.set(item);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  retour(): void {
    if (this.busy() || !this.canRetour()) {
      return;
    }

    this.busy.set(true);
    this.gateway.retourGudef(this.demandeId).subscribe({
      next: (item) => {
        this.busy.set(false);
        this.item.set(item);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  statutLabel(statut: string): string {
    return ctfStatutLabel(statut);
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

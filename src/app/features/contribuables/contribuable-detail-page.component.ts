import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { Contribuable } from '../../core/models/contribuables/contribuable.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { ContribuablesGateway } from '../../core/services/contribuables/contribuables.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-contribuable-detail-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header title="Fiche contribuable" [subtitle]="item()?.raisonSociale || ''" />
    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement de la fiche" />
    } @else if (item(); as contribuable) {
      <section class="detail-grid">
        <article class="pd-card">
          <h2>Identite</h2>
          <dl>
            <dt>NCC</dt>
            <dd>{{ contribuable.ncc }}</dd>
            <dt>Raison sociale</dt>
            <dd>{{ contribuable.raisonSociale }}</dd>
            <dt>Systeme comptable</dt>
            <dd>{{ contribuable.systemeComptable }}</dd>
            <dt>Secteur</dt>
            <dd>{{ contribuable.secteur || '-' }}</dd>
            <dt>Forme juridique</dt>
            <dd>{{ contribuable.formeJuridique || '-' }}</dd>
            <dt>Adresse</dt>
            <dd>{{ contribuable.adresse || '-' }}</dd>
          </dl>
        </article>
        <article class="pd-card">
          <h2>Contact</h2>
          <dl>
            <dt>Email</dt>
            <dd>{{ contribuable.email || contribuable.emailMasque || '-' }}</dd>
            <dt>Telephone</dt>
            <dd>{{ contribuable.telephone || contribuable.telephoneMasque || '-' }}</dd>
          </dl>
          @if (canReveal() && (!contribuable.email || !contribuable.telephone)) {
            <button type="button" class="pd-btn pd-btn--ghost pd-btn--sm" (click)="reveal()">
              Reveler les contacts
            </button>
          }
        </article>
        <article class="pd-card">
          <h2>Rattachement</h2>
          <dl>
            <dt>Centre</dt>
            <dd>{{ contribuable.centreImpotLibelle || contribuable.centreImpotId }}</dd>
            <dt>Direction</dt>
            <dd>{{ contribuable.directionRattachementId }}</dd>
            <dt>Statut</dt>
            <dd>{{ contribuable.isArchived ? 'Archive' : 'Actif' }}</dd>
          </dl>
        </article>
        <article class="pd-card">
          <h2>Qualite</h2>
          <dl>
            <dt>Email</dt>
            <dd>{{ contribuable.emailManquant ? 'Manquant' : 'Renseigne' }}</dd>
            <dt>Telephone</dt>
            <dd>{{ contribuable.telephoneManquant ? 'Manquant' : 'Renseigne' }}</dd>
            <dt>NCC hors format</dt>
            <dd>{{ contribuable.nccHorsFormat ? 'Oui' : 'Non' }}</dd>
            <dt>Derniere evaluation</dt>
            <dd>{{ contribuable.evalueLe }}</dd>
          </dl>
        </article>
      </section>

      <section class="pd-card">
        <div class="pd-actions">
          <a
            class="pd-btn pd-btn--ghost"
            [routerLink]="['/dashboard/contribuables', contribuable.id, 'modifier']"
            >Modifier</a
          >
          <button type="button" class="pd-btn pd-btn--ghost" (click)="sync()">
            Synchroniser e-impots
          </button>
          @if (!contribuable.isArchived) {
            <button type="button" class="pd-btn pd-btn--danger" (click)="archive()">
              Archiver
            </button>
          }
        </div>
        @if (message()) {
          <p class="pd-muted" role="status">{{ message() }}</p>
        }
      </section>

      <section class="pd-card">
        <h2>Historique des demandes</h2>
        <pdref-state-panel
          state="empty"
          title="Aucune demande"
          message="L historique sera alimente par le lot Demandes."
        />
      </section>
    }
  `,
  styleUrl: './contribuable-detail-page.component.scss',
})
export class ContribuableDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly gateway = inject(ContribuablesGateway);
  private readonly permissions = inject(PermissionsService);
  private readonly correlation = inject(CorrelationService);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly item = signal<Contribuable | null>(null);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly message = signal<string | null>(null);

  constructor() {
    this.load();
  }

  canReveal(): boolean {
    return this.permissions.hasPermission('Contribuables_ReadPii');
  }

  load(): void {
    this.loading.set(true);
    this.gateway.get(this.id).subscribe({
      next: (item) => {
        this.item.set(item);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  reveal(): void {
    this.gateway.get(this.id, true).subscribe({
      next: (item) => {
        this.item.set(item);
        this.message.set('Contacts reveles et consultation tracee.');
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  archive(): void {
    this.gateway.archive(this.id).subscribe({
      next: () => {
        this.message.set('Contribuable archive.');
        this.load();
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  sync(): void {
    this.gateway.syncEImpots(this.id).subscribe({
      next: () => this.message.set('Synchronisation e-impots demandee.'),
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }
}

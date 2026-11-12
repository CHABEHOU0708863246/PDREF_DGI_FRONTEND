import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type {
  Article24Controles,
  AvisDirection,
  MotifNonFavorable,
  SuiviDetail,
} from '../../core/models/suivis/suivi.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { SuivisGateway } from '../../core/services/suivis/suivis.gateway';
import { normalizeProblem } from '../../core/utils/problem';

@Component({
  selector: 'pdref-suivi-detail-page',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, StatePanelComponent, AbidjanDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      [title]="item()?.numero || 'Suivi'"
      subtitle="Avis des directions et validation globale."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Reessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement du suivi" />
    } @else if (item(); as detail) {
      <div class="actions">
        @if (canVerify() && detail.etapeCourante === 'VERIF_GUDEF') {
          <button type="button" class="pd-btn pd-btn--primary" (click)="verify()">
            Verifier GUDEF
          </button>
        }
        @if (canDecide() && detail.validationGlobale?.statut === 'EN_ATTENTE') {
          <a
            class="pd-btn pd-btn--primary"
            [routerLink]="['/dashboard/suivis', detail.demandeId, 'validation']"
          >
            Validation globale
          </a>
        }
        @if (canCorrect()) {
          <a
            class="pd-btn pd-btn--ghost"
            [routerLink]="['/dashboard/suivis', detail.demandeId, 'corriger']"
          >
            Corriger une decision
          </a>
        }
        @if (canSign() && detail.validationGlobale?.signatureStatut === 'EN_ATTENTE') {
          <button type="button" class="pd-btn pd-btn--primary" (click)="sign()">
            Signer le courrier
          </button>
        }
        @if (canDepot() && detail.validationGlobale?.depotEImpotsStatut === 'EN_ATTENTE') {
          <button type="button" class="pd-btn pd-btn--primary" (click)="depot()">
            Deposer e-impots
          </button>
        }
        <a class="pd-btn pd-btn--ghost" routerLink="/dashboard/suivis">Retour a la liste</a>
      </div>

      <section class="pd-card summary">
        <div>
          <span class="pd-label">NCC</span><strong>{{ detail.contribuable.ncc }}</strong>
        </div>
        <div>
          <span class="pd-label">Raison sociale</span
          ><strong>{{ detail.contribuable.raisonSociale }}</strong>
        </div>
        <div>
          <span class="pd-label">Statut</span><strong>{{ statutLabel(detail.statut) }}</strong>
        </div>
        <div>
          <span class="pd-label">Cycle</span><strong>{{ detail.cycle }}</strong>
        </div>
        <div>
          <span class="pd-label">Etape</span><strong>{{ detail.etapeCourante || '-' }}</strong>
        </div>
        <div>
          <span class="pd-label">Agent designe</span
          ><strong>{{ detail.assigneeUserId || '-' }}</strong>
        </div>
        <div>
          <span class="pd-label">Instruction</span><strong>{{ detail.instruction || '-' }}</strong>
        </div>
        <div>
          <span class="pd-label">Avis</span
          ><strong>{{ detail.avisRecus }} / {{ detail.avisTotal }}</strong>
        </div>
        <div>
          <span class="pd-label">Favorables</span><strong>{{ detail.avisFavorables }}</strong>
        </div>
        <div>
          <span class="pd-label">Non favorables</span
          ><strong>{{ detail.avisNonFavorables }}</strong>
        </div>
        <div>
          <span class="pd-label">Transmissions</span
          ><strong>{{ detail.transmissionsCount }}</strong>
        </div>
      </section>

      <section class="pd-card">
        <div class="section-head">
          <h2>Avis des directions</h2>
          @if (detail.avisRecus === detail.avisTotal) {
            <span class="pd-chip">Jointure complete</span>
          }
        </div>
        <div class="avis-grid">
          @for (avis of detail.avis; track avis.id) {
            <article class="avis-card" [class.avis-card--done]="avis.statut === 'EMIS'">
              <header>
                <strong>{{ stepLabel(avis.etapeCode) }}</strong>
                <span class="pd-chip">{{ avis.statut }}</span>
              </header>
              <p class="pd-muted">{{ avis.directionCode }}</p>
              @if (avis.decision) {
                <p>
                  <span
                    class="pd-chip"
                    [class.pd-chip--danger]="avis.decision === 'NON_FAVORABLE'"
                    >{{ avis.decision }}</span
                  >
                </p>
                <p class="pd-muted">Emis le {{ avis.emisLe | abidjanDate }}</p>
                @if (avis.motifCode) {
                  <p><strong>Motif :</strong> {{ motifLabel(avis.motifCode) }}</p>
                }
                <div class="article24-read">
                  <span
                    >3 ans : {{ article24Value(avis.article24?.insuffisanceMemeNature3Ans) }}</span
                  >
                  <span
                    >Redressement :
                    {{ article24Value(avis.article24?.engagementRedressementEnCours) }}</span
                  >
                  <span
                    >Avis comptable :
                    {{ article24Value(avis.article24?.avisVerificationComptabilite) }}</span
                  >
                  <span
                    >Verification approfondie :
                    {{ article24Value(avis.article24?.verificationApprofondieEnCours) }}</span
                  >
                </div>
              } @else if (avis.statut === 'EN_ATTENTE' && canAvis(avis)) {
                <label class="pd-field">
                  <span class="pd-label">Decision</span>
                  <select
                    class="pd-input"
                    [(ngModel)]="draft[avis.etapeCode].decision"
                    [name]="'decision-' + avis.id"
                  >
                    <option value="FAVORABLE">Favorable</option>
                    <option value="NON_FAVORABLE">Non favorable</option>
                  </select>
                </label>
                <fieldset class="article24">
                  <legend>Controles article 24</legend>
                  @for (control of article24Controls; track control.key) {
                    <label class="pd-field">
                      <span class="pd-label">{{ control.label }}</span>
                      <select
                        class="pd-input"
                        [(ngModel)]="draft[avis.etapeCode].article24[control.key]"
                        [name]="'article24-' + avis.id + '-' + control.key"
                      >
                        <option [ngValue]="null">Non renseigne</option>
                        <option [ngValue]="true">Oui</option>
                        <option [ngValue]="false">Non</option>
                      </select>
                    </label>
                  }
                </fieldset>
                @if (draft[avis.etapeCode].decision === 'NON_FAVORABLE') {
                  <label class="pd-field">
                    <span class="pd-label">Motif</span>
                    <select
                      class="pd-input"
                      [(ngModel)]="draft[avis.etapeCode].motifCode"
                      [name]="'motif-' + avis.id"
                    >
                      <option value="">Selectionner</option>
                      @for (motif of motifs(); track motif.code) {
                        <option [value]="motif.code">{{ motif.libelle }}</option>
                      }
                    </select>
                  </label>
                  <label class="pd-field">
                    <span class="pd-label">Precision</span>
                    <textarea
                      class="pd-input"
                      rows="2"
                      [(ngModel)]="draft[avis.etapeCode].commentaire"
                      [name]="'comment-' + avis.id"
                    ></textarea>
                  </label>
                }
                <button
                  type="button"
                  class="pd-btn pd-btn--primary pd-btn--sm"
                  (click)="decide(avis)"
                >
                  Emettre l'avis
                </button>
              } @else {
                <p class="pd-muted">Aucune action disponible.</p>
              }
            </article>
          }
        </div>
      </section>

      @if (detail.validationGlobale; as validation) {
        <section class="pd-card">
          <h2>Validation globale</h2>
          <div class="summary">
            <div>
              <span class="pd-label">Statut</span><strong>{{ validation.statut || '-' }}</strong>
            </div>
            <div>
              <span class="pd-label">Decision</span
              ><strong>{{ validation.decision || '-' }}</strong>
            </div>
            <div>
              <span class="pd-label">Signature</span
              ><strong>{{ validation.signatureStatut || '-' }}</strong>
            </div>
            <div>
              <span class="pd-label">Depot e-impots</span
              ><strong>{{ validation.depotEImpotsStatut || '-' }}</strong>
            </div>
            <div>
              <span class="pd-label">Reference depot</span
              ><strong>{{ validation.referenceDepotEImpots || '-' }}</strong>
            </div>
            <div>
              <span class="pd-label">Courrier</span
              ><strong>{{ validation.courrierReponseId || '-' }}</strong>
            </div>
          </div>
        </section>
      }

      @if (canTransmettre()) {
        <section class="pd-card">
          <h2>Transmettre le suivi</h2>
          <form class="transmission" (ngSubmit)="transmit()">
            <label class="pd-field">
              <span class="pd-label">Destinataires (userId, separes par une virgule, 1 a 5)</span>
              <input
                class="pd-input"
                [(ngModel)]="transmission.destinataires"
                name="destinataires"
              />
            </label>
            <label class="pd-field">
              <span class="pd-label">Commentaire interne (jamais transmis a l'exterieur)</span>
              <textarea
                class="pd-input"
                rows="2"
                [(ngModel)]="transmission.commentaireInterne"
                name="commentaire"
              ></textarea>
            </label>
            <button type="submit" class="pd-btn pd-btn--primary">Transmettre</button>
          </form>
        </section>
      }

      @if (detail.transmissions.length > 0) {
        <section class="pd-card">
          <h2>Transmissions</h2>
          <ul>
            @for (transmission of detail.transmissions; track transmission.id) {
              <li>
                {{ transmission.emisLe | abidjanDate }} -
                {{ transmission.destinataireUserIds.length }} destinataire(s)
                @if (transmission.commentaireInterne) {
                  <div class="pd-muted">{{ transmission.commentaireInterne }}</div>
                }
              </li>
            }
          </ul>
        </section>
      }

      @if (detail.corrections.length > 0) {
        <section class="pd-card">
          <h2>Corrections</h2>
          <div class="table-wrap" tabindex="0" role="region" aria-label="Corrections des decisions">
            <table class="pd-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Cible</th>
                  <th>Ancienne</th>
                  <th>Nouvelle</th>
                  <th>Motif</th>
                  <th>Empreinte</th>
                </tr>
              </thead>
              <tbody>
                @for (correction of detail.corrections; track correction.id) {
                  <tr>
                    <td>{{ correction.corrigeLe | abidjanDate }}</td>
                    <td>{{ correction.cibleType }}</td>
                    <td>{{ correction.ancienneDecision || '-' }}</td>
                    <td>{{ correction.nouvelleDecision }}</td>
                    <td>{{ correction.motif }}</td>
                    <td class="pd-muted">{{ correction.empreinteSha256.slice(0, 12) }}...</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    }
  `,
  styles: [
    `
      .actions,
      .summary {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
      }
      .actions {
        margin-bottom: 1rem;
      }
      .summary > div {
        display: grid;
        min-width: 11rem;
      }
      .avis-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: 1rem;
      }
      .avis-card {
        border: 1px solid var(--pd-border, #d9dee8);
        border-radius: 0.75rem;
        padding: 1rem;
        display: grid;
        gap: 0.65rem;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .avis-card--done {
        background: var(--pd-surface-2, #f6f8fb);
      }
      .avis-card header {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        align-items: center;
      }
      .transmission {
        display: grid;
        gap: 0.75rem;
      }
      .article24 {
        display: grid;
        gap: 0.5rem;
        border: 1px solid var(--pd-border, #d9dee8);
        border-radius: 0.5rem;
        padding: 0.75rem;
      }
      .article24-read {
        display: grid;
        gap: 0.25rem;
        font-size: 0.85rem;
      }
      .table-wrap {
        overflow-x: auto;
      }
    `,
  ],
})
export class SuiviDetailPageComponent {
  private readonly gateway = inject(SuivisGateway);
  private readonly route = inject(ActivatedRoute);
  private readonly permissions = inject(PermissionsService);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  readonly item = signal<SuiviDetail | null>(null);
  readonly motifs = signal<MotifNonFavorable[]>([]);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly article24Controls = [
    { key: 'insuffisanceMemeNature3Ans', label: 'Insuffisance de meme nature dans les 3 ans' },
    { key: 'engagementRedressementEnCours', label: 'Engagement de redressement en cours' },
    { key: 'avisVerificationComptabilite', label: 'Avis de verification de comptabilite' },
    { key: 'verificationApprofondieEnCours', label: 'Verification approfondie en cours' },
  ] as const;
  readonly draft: Record<
    string,
    {
      decision: 'FAVORABLE' | 'NON_FAVORABLE';
      motifCode: string;
      commentaire: string;
      article24: Article24Controles;
    }
  > = {};
  readonly transmission = { destinataires: '', commentaireInterne: '' };

  constructor() {
    this.load();
    this.gateway
      .motifs()
      .subscribe({ next: (items) => this.motifs.set(items), error: () => this.motifs.set([]) });
  }

  load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.get(this.id).subscribe({
      next: (item) => {
        this.item.set(item);
        for (const avis of item.avis) {
          this.draft[avis.etapeCode] ??= {
            decision: 'FAVORABLE',
            motifCode: '',
            commentaire: '',
            article24: this.emptyArticle24(avis),
          };
        }
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, null));
      },
    });
  }

  canVerify(): boolean {
    return this.permissions.hasPermission('Etapes_Verifier_Gudef');
  }

  canAvis(avis: AvisDirection): boolean {
    return (
      this.permissions.hasPermission('Avis_Emettre') &&
      avis.statut === 'EN_ATTENTE' &&
      this.roleForStep(avis.etapeCode)
    );
  }

  canDecide(): boolean {
    return this.permissions.hasPermission('Suivis_Decide') && this.permissions.hasRole('SD_GUDEF');
  }

  canCorrect(): boolean {
    return this.permissions.hasPermission('Suivis_Corriger');
  }

  canTransmettre(): boolean {
    return this.permissions.hasPermission('Suivis_Transmettre');
  }

  canSign(): boolean {
    return this.permissions.hasPermission('Courriers_Signer');
  }

  canDepot(): boolean {
    return this.permissions.hasPermission('Courriers_Deposer_EImpots');
  }

  verify(): void {
    this.gateway.verifierGudef(this.id).subscribe({
      next: (item) => {
        this.item.set(item);
        this.load();
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
    });
  }

  decide(avis: AvisDirection): void {
    const value = this.draft[avis.etapeCode];
    if (value.decision === 'NON_FAVORABLE' && !value.motifCode) {
      return;
    }
    this.gateway
      .decideAvis(this.id, avis.etapeCode, {
        decision: value.decision,
        motifCode: value.motifCode || null,
        commentaire: value.commentaire || null,
        article24: value.article24,
      })
      .subscribe({
        next: (item) => this.item.set(item),
        error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
      });
  }

  transmit(): void {
    const ids = this.transmission.destinataires
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    this.gateway
      .transmit(this.id, {
        destinataireUserIds: ids,
        commentaireInterne: this.transmission.commentaireInterne || null,
      })
      .subscribe({
        next: () => {
          this.transmission.destinataires = '';
          this.transmission.commentaireInterne = '';
          this.load();
        },
        error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
      });
  }

  sign(): void {
    this.gateway.signature(this.id).subscribe({
      next: () => this.load(),
      error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
    });
  }

  depot(): void {
    this.gateway.depot(this.id).subscribe({
      next: () => this.load(),
      error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
    });
  }

  statutLabel(statut: string): string {
    return (
      {
        AVIS_EN_COURS: 'Avis en cours',
        AVIS_COMPLET: 'Avis complet',
        VALIDATION_EN_ATTENTE: 'Validation en attente',
        VALIDATION_POSEE: 'Validation posee',
        CLOTURE: 'Cloture',
      }[statut] ?? statut
    );
  }

  stepLabel(step: string): string {
    return (
      {
        AVIS_DERAR: 'DERAR',
        AVIS_DVFN: 'DVFN',
        AVIS_RATTACHEMENT: 'Rattachement',
      }[step] ?? step
    );
  }

  motifLabel(code: string): string {
    return this.motifs().find((motif) => motif.code === code)?.libelle ?? code;
  }

  article24Value(value: boolean | null | undefined): string {
    return value === true ? 'Oui' : value === false ? 'Non' : 'Non renseigne';
  }

  private emptyArticle24(avis: AvisDirection): Article24Controles {
    return {
      insuffisanceMemeNature3Ans: avis.article24?.insuffisanceMemeNature3Ans ?? null,
      engagementRedressementEnCours: avis.article24?.engagementRedressementEnCours ?? null,
      avisVerificationComptabilite: avis.article24?.avisVerificationComptabilite ?? null,
      verificationApprofondieEnCours: avis.article24?.verificationApprofondieEnCours ?? null,
    };
  }

  private roleForStep(step: string): boolean {
    return (
      (step === 'AVIS_DERAR' && this.permissions.hasRole('DECIDEUR_DERAR')) ||
      (step === 'AVIS_DVFN' && this.permissions.hasRole('DECIDEUR_DVFN')) ||
      (step === 'AVIS_RATTACHEMENT' && this.permissions.hasRole('DIRECTEUR_RATTACHEMENT'))
    );
  }
}

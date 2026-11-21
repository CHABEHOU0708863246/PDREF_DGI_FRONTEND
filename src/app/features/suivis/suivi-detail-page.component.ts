import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type {
  Article24Controles,
  AvisDirection,
  MotifNonFavorable,
  SuiviDetail,
} from '../../core/models/suivis/suivi.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import {
  RejetDialogComponent,
  type RejetDialogValue,
} from '../../core/components/rejet-dialog/rejet-dialog.component';
import type { RejetMotif } from '../../core/models/rejets/rejet.model';
import { RejetGateway } from '../../core/services/rejets/rejet.gateway';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { AbidjanDatePipe } from '../../core/pipes/abidjan-date.pipe';
import { PermissionsService } from '../../core/services/permissions/permissions.service';
import { SuivisGateway } from '../../core/services/suivis/suivis.gateway';
import { normalizeProblem } from '../../core/utils/problem';
import { avisStatutLabel, decisionLabel } from '../../core/utils/labels';

@Component({
  selector: 'pdref-suivi-detail-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    PageHeaderComponent,
    StatePanelComponent,
    AbidjanDatePipe,
    RejetDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-page-header
      [title]="item()?.numero || 'Suivi'"
      subtitle="Avis des directions et validation globale."
    />

    @if (problem(); as issue) {
      <pdref-state-panel state="error" [problem]="issue" actionLabel="Réessayer" (retry)="load()" />
    } @else if (loading()) {
      <pdref-state-panel state="loading" title="Chargement du suivi" />
    } @else if (item(); as detail) {
      <div class="actions">
        @if (canVerify()) {
          <button type="button" class="pd-btn pd-btn--primary" (click)="verify()">
            Vérifier GUDEF
          </button>
        }
        @if (canReject()) {
          <button type="button" class="pd-btn pd-btn--danger" (click)="openRejet()">Rejeter</button>
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
            Corriger une décision
          </a>
        }
        @if (canSign() && detail.validationGlobale?.signatureStatut === 'EN_ATTENTE') {
          <button type="button" class="pd-btn pd-btn--primary" (click)="sign()">
            Signer le courrier
          </button>
        }
        <a class="pd-btn pd-btn--ghost" routerLink="/dashboard/suivis">Retour a la liste</a>
      </div>

      <section class="pd-card">
        <h2>Synthèse du dossier</h2>
        <div class="summary">
          <div>
            <span class="pd-label">NCC</span>
            <strong>{{ detail.contribuable.ncc }}</strong>
          </div>
          <div>
            <span class="pd-label">Raison sociale</span>
            <strong>{{ detail.contribuable.raisonSociale }}</strong>
          </div>
          <div>
            <span class="pd-label">Statut</span>
            <strong>{{ statutLabel(detail.statut) }}</strong>
          </div>
          <div>
            <span class="pd-label">Cycle</span>
            <strong>{{ detail.cycle }}</strong>
          </div>
          <div>
            <span class="pd-label">Étape</span>
            <strong>{{ stepLabel(detail.etapeCourante || '') || '-' }}</strong>
          </div>
          <div>
            <span class="pd-label">Agent désigné</span>
            <strong>{{ detail.assigneeName || detail.assigneeUserId || '-' }}</strong>
          </div>
          <div>
            <span class="pd-label">Instruction</span>
            <strong>{{ instructionLabel(detail.instruction) }}</strong>
          </div>
          <div>
            <span class="pd-label">Avis reçus</span>
            <strong>{{ detail.avisRecus }} / {{ detail.avisTotal }}</strong>
          </div>
          <div>
            <span class="pd-label">Favorables</span>
            <strong>{{ detail.avisFavorables }}</strong>
          </div>
          <div>
            <span class="pd-label">Non favorables</span>
            <strong>{{ detail.avisNonFavorables }}</strong>
          </div>
          <div>
            <span class="pd-label">Transmissions</span>
            <strong>{{ detail.transmissionsCount }}</strong>
          </div>
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
                <span class="pd-chip">{{ avisStatutLabel(avis.statut) }}</span>
              </header>
              <p class="pd-muted">{{ avis.directionCode }}</p>
              @if (avis.decision) {
                <p>
                  <span
                    class="pd-chip"
                    [class.pd-chip--danger]="avis.decision === 'NON_FAVORABLE'"
                    >{{ decisionLabel(avis.decision) }}</span
                  >
                </p>
                <p class="pd-muted">Emis le {{ avis.emisLe | abidjanDate }}</p>
                @if (avis.motifCode) {
                  <p><strong>Motif :</strong> {{ motifLabel(avis.motifCode) }}</p>
                }
                @if (avis.commentaire) {
                  <p class="pd-muted">Precision : {{ avis.commentaire }}</p>
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
                  <span class="pd-label">Décision</span>
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
                  @if (motifRequirement(draft[avis.etapeCode].motifCode); as requirement) {
                    <p class="pd-help">
                      Ce motif exige le controle article 24 « {{ requirement }} » = Oui.
                    </p>
                  } @else if (draft[avis.etapeCode].motifCode === 'AUTRE') {
                    <p class="pd-help">
                      Le motif Autre exige une précision dans le champ ci-dessous.
                    </p>
                  }
                  <label class="pd-field">
                    <span class="pd-label">Précision</span>
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
              <span class="pd-label">Décision</span
              ><strong>{{ validation.decision || '-' }}</strong>
            </div>
            <div>
              <span class="pd-label">Signature</span
              ><strong>{{ validation.signatureStatut || '-' }}</strong>
            </div>
            <div>
              <span class="pd-label">Dépôt</span
              ><strong>{{ validation.depotEImpotsStatut || '-' }}</strong>
            </div>
            <div>
              <span class="pd-label">Référence dépôt</span
              ><strong>{{ validation.referenceDepotEImpots || '-' }}</strong>
            </div>
            <div>
              <span class="pd-label">Courrier</span
              ><strong>{{
                validation.courrierNumero || validation.courrierReponseId || '-'
              }}</strong>
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

    <pdref-rejet-dialog
      [(open)]="rejetOpen"
      [motifs]="rejetMotifs()"
      [busy]="rejetBusy()"
      (confirmed)="confirmerRejet($event)"
    />
  `,
  styles: [
    `
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
      }
      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
        gap: 0.75rem;
        margin-top: 1rem;
      }
      .summary > div {
        display: grid;
        gap: 0.35rem;
        min-width: 0;
        padding: 0.8rem 0.9rem;
        border: 1px solid var(--pd-border, #d9dee8);
        border-radius: 0.65rem;
        background: var(--pd-surface-2, #f6f8fb);
      }
      .summary .pd-label {
        color: var(--pd-muted, #5c6b82);
        font-size: 0.72rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .summary strong {
        font-size: 1rem;
        line-height: 1.35;
        overflow-wrap: anywhere;
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
  readonly avisStatutLabel = avisStatutLabel;
  readonly decisionLabel = decisionLabel;
  private readonly gateway = inject(SuivisGateway);
  private readonly rejets = inject(RejetGateway);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly permissions = inject(PermissionsService);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  readonly item = signal<SuiviDetail | null>(null);
  readonly motifs = signal<MotifNonFavorable[]>([]);
  readonly loading = signal(true);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly rejetOpen = signal(false);
  readonly rejetMotifs = signal<readonly RejetMotif[]>([]);
  readonly rejetBusy = signal(false);
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
    if (this.permissions.hasPermission('Avis_Emettre')) {
      this.gateway
        .motifs()
        .subscribe({ next: (items) => this.motifs.set(items), error: () => this.motifs.set([]) });
    }
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
    return (
      this.permissions.hasPermission('Etapes_Verifier_Gudef') &&
      ['VERIF_GUDEF', 'CONFORMITE_AUTO'].includes(this.item()?.etapeCourante ?? '')
    );
  }

  canReject(): boolean {
    const item = this.item();
    return (
      ['VERIF_GUDEF', 'CONFORMITE_AUTO'].includes(item?.etapeCourante ?? '') &&
      this.permissions.hasPermission('Rejets_Create') &&
      (this.permissions.hasRole('SD_GUDEF') ||
        item?.assigneeUserId === this.permissions.currentUserId())
    );
  }

  openRejet(): void {
    this.rejets.motifs().subscribe({
      next: (items) => {
        this.rejetMotifs.set(items);
        this.rejetOpen.set(true);
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, null)),
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
        this.problem.set(normalizeProblem(error, null));
      },
    });
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
        next: () => this.load(),
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
        EN_ATTENTE_VERIFICATION: 'En attente de vérification',
        AVIS_EN_COURS: 'Avis en cours',
        AVIS_COMPLET: 'Avis complet',
        VALIDATION_EN_ATTENTE: 'Validation en attente',
        VALIDATION_POSEE: 'Validation posée',
        CLOTURE: 'Clôturé',
        REJETE: 'Rejeté',
      }[statut] ?? statut
    );
  }

  stepLabel(step: string): string {
    return (
      {
        CONFORMITE_AUTO: 'Conformité automatique',
        VERIF_GUDEF: 'Vérification GUDEF',
        AVIS_DERAR: 'DERAR',
        AVIS_DVFN: 'DVFN',
        AVIS_RATTACHEMENT: 'Rattachement',
        VALIDATION_GLOBALE_GUDEF: 'Validation globale GUDEF',
        NON_FAVORABLE: 'Non favorable',
      }[step] ?? step
    );
  }

  instructionLabel(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }
    const labels: Record<string, string> = {
      ACCEPTE_POUR_TRAITEMENT: 'Accepté pour traitement',
      VERIFICATION_SIMPLE: 'Vérification simple',
      VERIFICATION_APPROFONDIE: 'Vérification approfondie',
    };
    if (labels[value]) {
      return labels[value];
    }
    const readable = value.replaceAll('_', ' ').toLowerCase();
    return readable.charAt(0).toUpperCase() + readable.slice(1);
  }

  motifLabel(code: string): string {
    return this.motifs().find((motif) => motif.code === code)?.libelle ?? code;
  }

  motifRequirement(code: string): string | null {
    return (
      {
        INSUFFISANCE_MEME_NATURE_3ANS: 'Insuffisance de meme nature dans les 3 ans',
        ENGAGEMENT_REDRESSEMENT_EN_COURS: 'Engagement de redressement en cours',
        AVIS_VERIFICATION_COMPTABILITE: 'Avis de verification de comptabilite',
        VERIFICATION_APPROFONDIE_EN_COURS: 'Verification approfondie en cours',
      }[code] ?? null
    );
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

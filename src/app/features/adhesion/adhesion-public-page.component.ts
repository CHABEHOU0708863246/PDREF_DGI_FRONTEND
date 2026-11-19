import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import {
  ADHESION_PIECE_TYPES,
  type AdhesionPiece,
  type AdhesionVerify,
} from '../../core/models/adhesions/adhesion.model';
import { IconComponent } from '../../core/components/icon/icon.component';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';
import { AdhesionGateway } from '../../core/services/adhesions/adhesion.gateway';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { normalizeProblem } from '../../core/utils/problem';

type Step = 'form' | 'sent' | 'pieces' | 'done';

@Component({
  selector: 'pdref-adhesion-public-page',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    PageHeaderComponent,
    StatePanelComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './adhesion-public-page.component.html',
  styleUrl: './adhesion-public-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdhesionPublicPageComponent implements OnInit {
  private readonly gateway = inject(AdhesionGateway);
  private readonly route = inject(ActivatedRoute);
  private readonly correlation = inject(CorrelationService);

  readonly step = signal<Step>('form');
  readonly ncc = signal('');
  readonly nom = signal('');
  readonly prenom = signal('');
  readonly fonction = signal('');
  readonly email = signal('');
  readonly telephone = signal('');
  readonly uploadToken = signal('');
  readonly emailMasque = signal('');
  readonly pieces = signal<AdhesionPiece[]>([]);
  readonly busy = signal(false);
  readonly uploaded = signal<Record<string, string>>({});
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly pieceTypes = ADHESION_PIECE_TYPES;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.verify(token);
    }
  }

  submitDemand(): void {
    if (this.busy()) {
      return;
    }

    this.busy.set(true);
    this.problem.set(null);
    this.gateway
      .create({
        ncc: this.ncc().trim(),
        nom: this.nom().trim(),
        prenom: this.prenom().trim(),
        fonction: this.fonction().trim(),
        email: this.email().trim(),
        telephone: this.toInternationalPhone(this.telephone()),
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.step.set('sent');
        },
        error: (error: unknown) => {
          this.busy.set(false);
          this.problem.set(normalizeProblem(error, this.correlation.last));
        },
      });
  }

  upload(type: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.uploadToken()) {
      return;
    }

    this.busy.set(true);
    this.problem.set(null);
    this.gateway.uploadPiece(this.uploadToken(), type, file).subscribe({
      next: (piece) => {
        this.busy.set(false);
        this.uploaded.update((value) => ({ ...value, [type]: piece.fileName }));
        this.pieces.update((items) => [...items.filter((item) => item.type !== type), piece]);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  submitPieces(): void {
    if (this.busy()) {
      return;
    }

    this.busy.set(true);
    this.problem.set(null);
    this.gateway.submit(this.uploadToken()).subscribe({
      next: () => {
        this.busy.set(false);
        this.step.set('done');
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  modeleHref(): string {
    return this.gateway.modeleUrl();
  }

  allPiecesPresent(): boolean {
    return this.pieceTypes.every((type) => Boolean(this.uploaded()[type.code]));
  }

  private toInternationalPhone(value: string): string {
    const digits = value.replace(/\D/g, '').replace(/^00/, '');
    const local = digits.startsWith('225') ? digits.slice(3) : digits;
    return local.length > 0 ? `+225${local}` : value.trim();
  }

  private verify(token: string): void {
    this.busy.set(true);
    this.gateway.verify(token).subscribe({
      next: (result: AdhesionVerify) => {
        this.busy.set(false);
        this.uploadToken.set(result.jeton);
        this.emailMasque.set(result.emailMasque);
        this.pieces.set(result.pieces);
        this.uploaded.set(
          Object.fromEntries(result.pieces.map((piece) => [piece.type, piece.fileName])),
        );
        this.step.set('pieces');
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }
}

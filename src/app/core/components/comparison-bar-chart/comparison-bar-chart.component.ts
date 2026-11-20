import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface ComparisonDatum {
  label: string;
  courant: number;
  precedent: number;
}

interface ComparisonBar {
  label: string;
  courant: number;
  precedent: number;
  x: number;
  largeur: number;
  courantY: number;
  courantHauteur: number;
  precedentY: number;
  precedentHauteur: number;
  centre: number;
}

@Component({
  selector: 'pdref-comparison-bar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="comparison" [attr.aria-label]="title()">
      @if (series().length === 0) {
        <p class="comparison__empty">Aucune donnee sur la periode.</p>
      } @else {
        <div class="comparison__legend">
          <span
            ><i class="comparison__swatch comparison__swatch--courant"></i
            >{{ currentLabel() }}</span
          >
          <span
            ><i class="comparison__swatch comparison__swatch--precedent"></i
            >{{ previousLabel() }}</span
          >
        </div>
        <div class="comparison__visual" aria-hidden="true">
          <svg class="comparison__svg" viewBox="0 0 640 280">
            <line class="comparison__axis" x1="24" y1="220" x2="616" y2="220" />
            @for (bar of bars(); track bar.label) {
              <g>
                <rect
                  class="comparison__bar comparison__bar--precedent"
                  [attr.x]="bar.x"
                  [attr.y]="bar.precedentY"
                  [attr.width]="bar.largeur / 2 - 1"
                  [attr.height]="bar.precedentHauteur"
                  rx="3"
                >
                  <title>{{ bar.label }} - {{ previousLabel() }} : {{ bar.precedent }}</title>
                </rect>
                <rect
                  class="comparison__bar comparison__bar--courant"
                  [attr.x]="bar.x + bar.largeur / 2 + 1"
                  [attr.y]="bar.courantY"
                  [attr.width]="bar.largeur / 2 - 1"
                  [attr.height]="bar.courantHauteur"
                  rx="3"
                >
                  <title>{{ bar.label }} - {{ currentLabel() }} : {{ bar.courant }}</title>
                </rect>
                <text
                  class="comparison__label"
                  [attr.x]="bar.centre"
                  [attr.y]="236"
                  text-anchor="end"
                  [attr.transform]="'rotate(-30 ' + bar.centre + ' 236)'"
                >
                  {{ shortLabel(bar.label) }}
                </text>
              </g>
            }
          </svg>
        </div>
        <table class="pd-visually-hidden">
          <caption>
            {{
              title()
            }}
          </caption>
          <thead>
            <tr>
              <th>Periode</th>
              <th>{{ currentLabel() }}</th>
              <th>{{ previousLabel() }}</th>
            </tr>
          </thead>
          <tbody>
            @for (bar of bars(); track bar.label) {
              <tr>
                <td>{{ bar.label }}</td>
                <td>{{ bar.courant }}</td>
                <td>{{ bar.precedent }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: [
    `
      .comparison {
        display: grid;
        gap: 0.75rem;
      }
      .comparison__legend {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        color: var(--color-text-muted);
        font-size: var(--text-sm);
      }
      .comparison__legend span {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
      }
      .comparison__swatch {
        inline-size: 0.8rem;
        block-size: 0.8rem;
        border-radius: 2px;
        display: inline-block;
      }
      .comparison__swatch--courant {
        background: var(--color-primary);
      }
      .comparison__swatch--precedent {
        background: var(--color-border-strong, #9aa7b6);
      }
      .comparison__svg {
        inline-size: 100%;
        block-size: auto;
      }
      .comparison__axis {
        stroke: var(--color-border);
        stroke-width: 1;
      }
      .comparison__bar--courant {
        fill: var(--color-primary);
      }
      .comparison__bar--precedent {
        fill: var(--color-border-strong, #9aa7b6);
      }
      .comparison__label {
        font-size: 0.65rem;
        fill: var(--color-text-muted);
      }
      .comparison__empty {
        color: var(--color-text-muted);
        margin: 0;
      }
    `,
  ],
})
export class ComparisonBarChartComponent {
  readonly series = input<readonly ComparisonDatum[]>([]);
  readonly title = input('Evolution');
  readonly currentLabel = input('Periode');
  readonly previousLabel = input('Annee precedente');

  readonly maxValue = computed(() =>
    Math.max(1, ...this.series().flatMap((item) => [item.courant, item.precedent])),
  );

  readonly bars = computed<ComparisonBar[]>(() => {
    const items = this.series();
    if (items.length === 0) {
      return [];
    }
    const max = this.maxValue();
    const groupWidth = Math.min(64, 560 / items.length);
    const gap = Math.min(28, 70 / items.length);
    return items.map((item, index) => {
      const x = 40 + index * (groupWidth + gap);
      const courantHauteur = Math.max(2, Math.round((item.courant / max) * 170));
      const precedentHauteur = Math.max(2, Math.round((item.precedent / max) * 170));
      return {
        label: item.label,
        courant: item.courant,
        precedent: item.precedent,
        x,
        largeur: groupWidth,
        courantY: 220 - courantHauteur,
        courantHauteur,
        precedentY: 220 - precedentHauteur,
        precedentHauteur,
        centre: x + groupWidth / 2,
      };
    });
  });

  shortLabel(label: string): string {
    return label.length > 12 ? `${label.slice(0, 11).trimEnd()}...` : label;
  }
}

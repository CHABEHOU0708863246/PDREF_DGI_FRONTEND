import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface DonutDatum {
  label: string;
  value: number;
  color?: string;
}

interface DonutSegment extends DonutDatum {
  color: string;
  dash: string;
  offset: number;
  percent: number;
}

const PALETTE = [
  '#0d365c',
  '#c69e2d',
  '#1f7a8c',
  '#b3423a',
  '#6b5b95',
  '#4b8f5a',
  '#c46a1b',
  '#5c6b7a',
];

@Component({
  selector: 'pdref-donut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="donut" [attr.aria-label]="title()">
      @if (total() === 0) {
        <p class="donut__empty">{{ emptyLabel() }}</p>
      } @else {
        <div class="donut__body">
          <svg class="donut__svg" viewBox="0 0 220 220" role="img" [attr.aria-label]="ariaLabel()">
            <circle class="donut__track" cx="110" cy="110" r="80" />
            @for (segment of segments(); track segment.label) {
              <circle
                class="donut__segment"
                cx="110"
                cy="110"
                r="80"
                [attr.stroke]="segment.color"
                [attr.stroke-dasharray]="segment.dash"
                [attr.stroke-dashoffset]="segment.offset"
                transform="rotate(-90 110 110)"
              >
                <title>{{ segment.label }} : {{ segment.value }} {{ unit() }}</title>
              </circle>
            }
            <text class="donut__total" x="110" y="106" text-anchor="middle">
              {{ total() }}
            </text>
            <text class="donut__unit" x="110" y="128" text-anchor="middle">
              {{ unit() }}
            </text>
          </svg>
          <ul class="donut__legend">
            @for (segment of segments(); track segment.label) {
              <li>
                <span
                  class="donut__dot"
                  [style.background]="segment.color"
                  aria-hidden="true"
                ></span>
                <span class="donut__label">{{ segment.label }}</span>
                <strong>{{ segment.value }}</strong>
                <span class="donut__percent">{{ formatPercent(segment.percent) }}</span>
              </li>
            }
          </ul>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .donut {
        display: grid;
        gap: 0.5rem;
      }
      .donut__body {
        display: grid;
        grid-template-columns: minmax(150px, 210px) minmax(0, 1fr);
        gap: 1rem;
        align-items: center;
      }
      .donut__svg {
        inline-size: 100%;
        block-size: auto;
        max-block-size: 210px;
      }
      .donut__track,
      .donut__segment {
        fill: none;
        stroke-width: 26;
      }
      .donut__track {
        stroke: var(--color-border);
      }
      .donut__segment {
        stroke-linecap: butt;
      }
      .donut__total {
        font-size: 1.5rem;
        font-weight: 700;
        fill: var(--color-text);
      }
      .donut__unit {
        font-size: 0.7rem;
        fill: var(--color-text-muted);
      }
      .donut__legend {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 0.35rem;
      }
      .donut__legend li {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto auto;
        gap: 0.5rem;
        align-items: center;
        font-size: var(--text-sm);
      }
      .donut__dot {
        inline-size: 0.65rem;
        block-size: 0.65rem;
        border-radius: 50%;
      }
      .donut__label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .donut__percent {
        color: var(--color-text-muted);
        min-inline-size: 3.2rem;
        text-align: end;
      }
      .donut__empty {
        color: var(--color-text-muted);
        margin: 0;
      }
      @media (max-width: 47.99rem) {
        .donut__body {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DonutChartComponent {
  readonly series = input<readonly DonutDatum[]>([]);
  readonly title = input('Repartition');
  readonly unit = input('demandes');
  readonly emptyLabel = input('Aucune donnee sur la periode.');

  readonly total = computed(() =>
    this.series().reduce((sum, item) => sum + Math.max(0, item.value), 0),
  );

  readonly segments = computed<DonutSegment[]>(() => {
    const items = this.series().filter((item) => item.value > 0);
    const total = this.total();
    if (total === 0) {
      return [];
    }
    const circumference = 2 * Math.PI * 80;
    let cumulative = 0;
    return items.map((item, index) => {
      const fraction = item.value / total;
      const length = fraction * circumference;
      const gap = length > 4 ? 2 : 0;
      const segment: DonutSegment = {
        label: item.label,
        value: item.value,
        color: item.color ?? PALETTE[index % PALETTE.length],
        dash: `${Math.max(0, length - gap)} ${circumference}`,
        offset: -cumulative,
        percent: fraction * 100,
      };
      cumulative += length;
      return segment;
    });
  });

  readonly ariaLabel = computed(
    () =>
      `${this.title()} : ${this.segments()
        .map((item) => `${item.label} ${item.value}`)
        .join(', ')}`,
  );

  formatPercent(value: number): string {
    return `${value.toFixed(1).replace('.', ',')} %`;
  }
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface LineDatum {
  label: string;
  value: number;
}

interface LinePoint extends LineDatum {
  x: number;
  y: number;
}

interface GridLine {
  y: number;
  value: number;
}

@Component({
  selector: 'pdref-line-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="line-chart" [attr.aria-label]="title()">
      @if (series().length === 0) {
        <p class="line-chart__empty">Aucune donnee sur la periode.</p>
      } @else {
        <div class="line-chart__visual" aria-hidden="true">
          <svg class="line-chart__svg" viewBox="0 0 640 260">
            @for (grid of gridLines(); track grid.value) {
              <line
                class="line-chart__grid"
                x1="40"
                [attr.y1]="grid.y"
                x2="610"
                [attr.y2]="grid.y"
              />
              <text class="line-chart__axis-label" x="30" [attr.y]="grid.y + 4" text-anchor="end">
                {{ grid.value }}
              </text>
            }
            <path class="line-chart__area" [attr.d]="areaPath()" />
            <path class="line-chart__line" [attr.d]="linePath()" />
            @for (point of points(); track point.label) {
              <circle class="line-chart__point" [attr.cx]="point.x" [attr.cy]="point.y" r="4">
                <title>{{ point.label }} : {{ point.value }} {{ unit() }}</title>
              </circle>
              <text class="line-chart__label" [attr.x]="point.x" y="246" text-anchor="middle">
                {{ shortLabel(point.label) }}
              </text>
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
              <th>Valeur</th>
            </tr>
          </thead>
          <tbody>
            @for (point of points(); track point.label) {
              <tr>
                <td>{{ point.label }}</td>
                <td>{{ point.value }} {{ unit() }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: [
    `
      .line-chart {
        display: grid;
        gap: 0.5rem;
      }
      .line-chart__svg {
        inline-size: 100%;
        block-size: auto;
      }
      .line-chart__grid {
        stroke: var(--color-border);
        stroke-width: 1;
        stroke-dasharray: 3 4;
      }
      .line-chart__axis-label,
      .line-chart__label {
        font-size: 0.65rem;
        fill: var(--color-text-muted);
      }
      .line-chart__area {
        fill: color-mix(in srgb, var(--color-primary) 12%, transparent);
        stroke: none;
      }
      .line-chart__line {
        fill: none;
        stroke: var(--color-primary);
        stroke-width: 2.5;
        stroke-linejoin: round;
        stroke-linecap: round;
      }
      .line-chart__point {
        fill: var(--color-primary);
        stroke: var(--color-surface);
        stroke-width: 2;
      }
      .line-chart__empty {
        color: var(--color-text-muted);
        margin: 0;
      }
    `,
  ],
})
export class LineChartComponent {
  readonly series = input<readonly LineDatum[]>([]);
  readonly title = input('Evolution');
  readonly unit = input('demandes');

  readonly maxValue = computed(() => Math.max(1, ...this.series().map((item) => item.value)));

  readonly points = computed<LinePoint[]>(() => {
    const items = this.series();
    if (items.length === 0) {
      return [];
    }
    const max = this.maxValue();
    return items.map((item, index) => {
      const x = items.length === 1 ? 320 : 40 + (index * 570) / (items.length - 1);
      const y = 210 - (Math.max(0, item.value) / max) * 160;
      return { label: item.label, value: item.value, x, y };
    });
  });

  readonly linePath = computed(() => {
    const points = this.points();
    if (points.length === 0) {
      return '';
    }
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let index = 1; index < points.length; index++) {
      const previous = points[index - 1];
      const current = points[index];
      const middle = (previous.x + current.x) / 2;
      path += ` C ${middle} ${previous.y}, ${middle} ${current.y}, ${current.x} ${current.y}`;
    }
    return path;
  });

  readonly areaPath = computed(() => {
    const points = this.points();
    if (points.length === 0) {
      return '';
    }
    return `${this.linePath()} L ${points[points.length - 1].x} 210 L ${points[0].x} 210 Z`;
  });

  readonly gridLines = computed<GridLine[]>(() => {
    const max = this.maxValue();
    return [
      { y: 50, value: max },
      { y: 130, value: Math.round(max / 2) },
      { y: 210, value: 0 },
    ];
  });

  shortLabel(label: string): string {
    return label.length > 9 ? `${label.slice(0, 8).trimEnd()}...` : label;
  }
}

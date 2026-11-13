import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface BarChartDatum {
  label: string;
  value: number;
}

@Component({
  selector: 'pdref-bar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bar-chart" [attr.aria-label]="title()">
      @if (series().length === 0) {
        <p class="bar-chart__empty">Aucune alerte sur la periode.</p>
      } @else {
        <p class="bar-chart__unit">{{ unit() }}</p>
        <div class="bar-chart__visual" aria-hidden="true">
          <svg class="bar-chart__svg" viewBox="0 0 640 260">
            <line class="bar-chart__axis" x1="24" y1="220" x2="616" y2="220" />
            @for (bar of bars(); track bar.label; let index = $index) {
              <g class="bar-chart__bar" (click)="select(bar.label)">
                <rect
                  [attr.x]="bar.x"
                  [attr.y]="bar.y"
                  [attr.width]="bar.width"
                  [attr.height]="bar.height"
                  rx="4"
                >
                  <title>{{ bar.label }} : {{ bar.value }} {{ unit() }}</title>
                </rect>
                <text
                  class="bar-chart__value"
                  [attr.x]="bar.x + bar.width / 2"
                  [attr.y]="bar.y - 8"
                  text-anchor="middle"
                >
                  {{ bar.value }}
                </text>
                <text
                  class="bar-chart__label"
                  [attr.x]="bar.x + bar.width / 2"
                  [attr.y]="236"
                  text-anchor="end"
                  [attr.transform]="'rotate(-30 ' + (bar.x + bar.width / 2) + ' 236)'"
                >
                  {{ shortLabel(bar.label) }}
                </text>
              </g>
            }
          </svg>
        </div>
        <div class="pd-visually-hidden">
          @for (bar of bars(); track bar.label) {
            <button type="button" (click)="select(bar.label)">
              {{ bar.label }} : {{ bar.value }} {{ unit() }}
            </button>
          }
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
            @for (bar of bars(); track bar.label) {
              <tr>
                <td>{{ bar.label }}</td>
                <td>{{ bar.value }} {{ unit() }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styleUrl: './bar-chart.component.scss',
})
export class BarChartComponent {
  readonly series = input<readonly BarChartDatum[]>([]);
  readonly title = input('Repartition');
  readonly unit = input('alertes');
  readonly barClick = output<string>();

  readonly maxValue = computed(() => Math.max(1, ...this.series().map((item) => item.value)));

  readonly bars = computed(() => {
    const items = this.series();
    const width = items.length === 0 ? 0 : Math.min(56, 560 / items.length);
    const gap = items.length === 0 ? 0 : Math.min(32, 80 / items.length);
    return items.map((item, index) => {
      const height = Math.max(2, Math.round((item.value / this.maxValue()) * 170));
      return {
        label: item.label,
        value: item.value,
        width,
        x: 40 + index * (width + gap),
        y: 220 - height,
        height,
      };
    });
  });

  select(label: string): void {
    this.barClick.emit(label);
  }

  onSpace(event: Event, label: string): void {
    event.preventDefault();
    this.select(label);
  }

  shortLabel(label: string): string {
    return label.length > 12 ? `${label.slice(0, 11)}...` : label;
  }
}

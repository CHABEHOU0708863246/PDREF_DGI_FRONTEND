import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ApiProblemDetails } from '../../models/common/api-problem.model';
import type { IconName } from '../../models/common/icon.model';
import { formatFcfa } from '../../utils/format-fcfa';
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { StatePanelComponent } from '../state-panel/state-panel.component';

export type KpiState = 'loading' | 'success' | 'empty' | 'error';

export interface KpiTrend {
  direction: 'up' | 'down' | 'flat';
  label: string;
}

@Component({
  selector: 'pdref-kpi-card',
  standalone: true,
  imports: [IconComponent, SkeletonComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="kpi-card" [attr.aria-label]="ariaLabel()">
      @switch (state()) {
        @case ('loading') {
          <pdref-skeleton [lines]="3" [label]="label()" />
        }
        @case ('error') {
          <pdref-state-panel
            state="error"
            [title]="label()"
            message="Indicateur indisponible."
            [problem]="problem()"
            actionLabel="Reessayer"
            (retry)="retry.emit()"
          />
        }
        @case ('empty') {
          <div class="kpi-card__body">
            <span class="kpi-card__label">{{ label() }}</span>
            <strong class="kpi-card__value">—</strong>
            <span class="kpi-card__hint">{{ hint() || 'Aucune donnee' }}</span>
          </div>
        }
        @default {
          <div class="kpi-card__body">
            <div class="kpi-card__head">
              <span class="kpi-card__label">{{ label() }}</span>
              @if (icon(); as iconName) {
                <span class="kpi-card__icon"><pdref-icon [name]="iconName" /></span>
              }
            </div>
            <strong class="kpi-card__value">
              {{ displayValue() }}
              @if (unit()) {
                <small>{{ unit() }}</small>
              }
            </strong>
            @if (trend(); as item) {
              <span [class]="'kpi-card__trend kpi-card__trend--' + item.direction">
                <pdref-icon [name]="trendIcon()" size="sm" />
                {{ item.label }}
              </span>
            }
            @if (hint()) {
              <span class="kpi-card__hint">{{ hint() }}</span>
            }
          </div>
        }
      }
    </article>
  `,
  styleUrl: './kpi-card.component.scss',
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input<string | number | null>(null);
  readonly format = input<'text' | 'fcfa'>('text');
  readonly unit = input<string>();
  readonly hint = input<string>();
  readonly icon = input<IconName>();
  readonly trend = input<KpiTrend>();
  readonly state = input<KpiState>('success');
  readonly problem = input<ApiProblemDetails | null>(null);

  readonly retry = output<void>();

  readonly displayValue = computed(() => {
    const value = this.value();
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return this.format() === 'fcfa' ? formatFcfa(value) : String(value);
  });

  readonly trendIcon = computed<IconName>(() => {
    const direction = this.trend()?.direction;
    if (direction === 'up') {
      return 'arrow-up';
    }
    if (direction === 'down') {
      return 'arrow-down';
    }
    return 'minus';
  });

  readonly ariaLabel = computed(() => {
    const value = this.format() === 'fcfa' ? formatFcfa(this.value()) : this.displayValue();
    const trend = this.trend();
    return `${this.label()} : ${value}${trend ? `, ${trend.label}` : ''}`;
  });
}

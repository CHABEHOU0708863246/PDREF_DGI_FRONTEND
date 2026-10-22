import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { StatusTone } from '../../models/common/status.model';
import { resolveStatus } from '../../models/common/status.model';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'pdref-status-badge',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="classes()" [attr.aria-label]="'Statut : ' + descriptor().label">
      <pdref-icon [name]="descriptor().icon" size="sm" />
      <span>{{ descriptor().label }}</span>
    </span>
  `,
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly label = input<string>();
  readonly tone = input<StatusTone>();
  readonly pulse = input(false);
  readonly size = input<'sm' | 'md'>('md');

  readonly descriptor = computed(() => resolveStatus(this.status(), this.label(), this.tone()));

  readonly classes = computed(() =>
    [
      'status-badge',
      `status-badge--${this.descriptor().tone}`,
      this.size() === 'sm' ? 'status-badge--sm' : '',
      this.pulse() ? 'status-badge--pulse' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
}

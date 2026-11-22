import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { ThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'pdref-theme-toggle',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="pd-icon-btn theme-toggle"
      [attr.aria-label]="theme.isDark() ? 'Passer en thème clair' : 'Passer en thème sombre'"
      [attr.aria-pressed]="theme.isDark()"
      (click)="theme.toggle()"
    >
      <pdref-icon [name]="theme.isDark() ? 'sun' : 'moon'" label="" />
    </button>
  `,
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}

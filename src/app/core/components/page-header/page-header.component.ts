import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pdref-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div>
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p class="pd-muted">{{ subtitle() }}</p>
        }
      </div>
      <div class="page-header__actions">
        <ng-content />
      </div>
    </header>
  `,
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}

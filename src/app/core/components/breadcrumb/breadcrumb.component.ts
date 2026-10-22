import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { BreadcrumbItem } from '../../models/common/breadcrumb.model';

@Component({
  selector: 'pdref-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="breadcrumb" aria-label="Fil d'Ariane">
      <ol>
        @for (item of items(); track item.label; let last = $last) {
          <li>
            @if (!last && item.url) {
              <a [routerLink]="item.url">{{ item.label }}</a>
            } @else {
              <span [attr.aria-current]="last ? 'page' : null">{{ item.label }}</span>
            }
            @if (!last) {
              <span class="breadcrumb__sep" aria-hidden="true">/</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent {
  readonly items = input<readonly BreadcrumbItem[]>([]);
}

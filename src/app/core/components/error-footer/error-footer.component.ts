import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ApiProblemDetails } from '../../models/common/api-problem.model';

@Component({
  selector: 'pdref-error-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (problem(); as value) {
      <p class="error-footer">
        <span
          >Code : <code>{{ value.code }}</code></span
        >
        <span
          >Trace : <code>{{ value.traceId }}</code></span
        >
        @if (value.reference) {
          <span
            >Reference : <code>{{ value.reference }}</code></span
          >
        }
      </p>
    }
  `,
  styleUrl: './error-footer.component.scss',
})
export class ErrorFooterComponent {
  readonly problem = input<ApiProblemDetails | null>(null);
}

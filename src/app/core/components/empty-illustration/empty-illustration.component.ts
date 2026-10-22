import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pdref-empty-illustration',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-illustration" aria-hidden="true">
      <span class="empty-illustration__plate empty-illustration__plate--back"></span>
      <span class="empty-illustration__plate empty-illustration__plate--middle"></span>
      <span class="empty-illustration__plate empty-illustration__plate--front">
        <span class="empty-illustration__line"></span>
        <span class="empty-illustration__line empty-illustration__line--short"></span>
        <span class="empty-illustration__dot"></span>
      </span>
    </div>
  `,
  styleUrl: './empty-illustration.component.scss',
})
export class EmptyIllustrationComponent {
  readonly size = input<'sm' | 'lg'>('lg');
}

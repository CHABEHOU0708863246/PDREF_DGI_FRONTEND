import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'pdref-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton" role="status" [attr.aria-label]="label()">
      @for (line of linesArray(); track $index) {
        <span class="pd-skeleton skeleton__line" [class.skeleton__line--title]="$first"></span>
      }
    </div>
  `,
  styleUrl: './skeleton.component.scss',
})
export class SkeletonComponent {
  readonly lines = input(3);
  readonly label = input('Chargement');

  readonly linesArray = computed(() => Array.from({ length: Math.max(1, this.lines()) }));
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FcfaPipe } from '../../pipes/fcfa.pipe';
import { formatFcfa } from '../../utils/format-fcfa';

@Component({
  selector: 'pdref-amount-fcfa',
  standalone: true,
  imports: [FcfaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <span
        class="pd-skeleton amount-skeleton"
        role="status"
        aria-label="Montant en chargement"
      ></span>
    } @else if (error()) {
      <span class="amount amount--error" aria-label="Montant indisponible">—</span>
    } @else {
      <span [class]="classes()" [attr.aria-label]="ariaLabel()">
        {{ value() | fcfa: withCurrency() }}
      </span>
    }
  `,
  styleUrl: './amount-fcfa.component.scss',
})
export class AmountFcfaComponent {
  readonly value = input<string | number | null>(null);
  readonly withCurrency = input(true);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly tone = input<'default' | 'positive' | 'negative' | 'muted'>('default');
  readonly loading = input(false);
  readonly error = input(false);

  readonly ariaLabel = computed(() => {
    const formatted = formatFcfa(this.value(), this.withCurrency());
    return formatted === '—' ? 'Montant indisponible' : formatted;
  });

  readonly classes = computed(() =>
    ['amount', `amount--${this.tone()}`, this.size() === 'lg' ? 'amount--lg' : '']
      .filter(Boolean)
      .join(' '),
  );
}

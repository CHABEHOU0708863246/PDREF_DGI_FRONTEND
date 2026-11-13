import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import type { OnDestroy } from '@angular/core';

@Component({
  selector: 'pdref-live-clock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="live-clock">
      <time
        class="live-clock__date"
        [attr.datetime]="now().toISOString()"
        aria-live="off"
        data-testid="dashboard-live-clock"
        >{{ formattedDate() }}</time
      >
      <span class="live-clock__refresh" data-testid="dashboard-refresh-counter">
        Donnees actualisees il y a {{ elapsedSeconds() }} s
      </span>
    </div>
  `,
  styles: [
    `
      .live-clock {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.15rem;
        line-height: 1.3;
      }

      .live-clock__date {
        font-weight: 600;
        text-transform: capitalize;
      }

      .live-clock__refresh {
        color: var(--color-text-muted);
        font-size: var(--text-sm);
      }

      @media (max-width: 767px) {
        .live-clock {
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class LiveClockComponent implements OnDestroy {
  readonly lastRefreshAt = input(Date.now());
  readonly now = signal(new Date());

  private readonly timer = setInterval(() => this.now.set(new Date()), 1_000);

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  formattedDate(): string {
    const parts = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Africa/Abidjan',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(this.now());
    const value = (type: Intl.DateTimeFormatPartTypes): string =>
      parts.find((part) => part.type === type)?.value ?? '';
    return `${value('weekday')} ${value('day')} ${value('month')} ${value('year')} · ${value('hour')}:${value('minute')}`;
  }

  elapsedSeconds(): number {
    return Math.max(0, Math.floor((this.now().getTime() - this.lastRefreshAt()) / 1_000));
  }
}

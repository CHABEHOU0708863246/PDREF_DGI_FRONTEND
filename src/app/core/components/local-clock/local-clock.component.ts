import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'pdref-local-clock',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<time class="pd-muted" [attr.datetime]="now().toISOString()">{{ now() | date: 'dd/MM/yyyy HH:mm:ss' }}</time>`,
})
export class LocalClockComponent implements OnDestroy {
  readonly now = signal(new Date());
  private readonly timer = setInterval(() => this.now.set(new Date()), 1000);

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}

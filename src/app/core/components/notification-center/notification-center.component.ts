import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { AbidjanDatePipe } from '../../pipes/abidjan-date.pipe';
import { NotificationCenterService } from '../../services/notifications/notification-center.service';
import { IconComponent } from '../icon/icon.component';
import { StatePanelComponent } from '../state-panel/state-panel.component';

@Component({
  selector: 'pdref-notification-center',
  standalone: true,
  imports: [AbidjanDatePipe, IconComponent, StatePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notification-center" #root>
      <button
        type="button"
        class="pd-icon-btn notification-center__button"
        [attr.aria-label]="'Notifications, ' + service.unreadCount() + ' non lue(s)'"
        [attr.aria-expanded]="open()"
        aria-controls="notification-panel"
        (click)="toggle()"
      >
        <pdref-icon name="bell" />
        @if (service.unreadCount() > 0) {
          <span class="notification-center__badge" aria-hidden="true">
            {{ service.unreadCount() }}
          </span>
        }
      </button>

      @if (open()) {
        <section
          id="notification-panel"
          class="notification-panel"
          role="region"
          aria-label="Notifications"
        >
          <header class="notification-panel__head">
            <h2>Notifications</h2>
            @if (service.unreadCount() > 0) {
              <button type="button" class="pd-btn pd-btn--ghost pd-btn--sm" (click)="markAllRead()">
                Tout marquer comme lu
              </button>
            }
          </header>

          @if (service.items().length === 0) {
            <pdref-state-panel
              state="empty"
              title="Aucune notification"
              message="Les messages importants apparaitront ici."
            />
          } @else {
            <ul class="notification-list">
              @for (item of service.items(); track item.id) {
                <li class="notification-item" [class.notification-item--unread]="!item.read">
                  <span
                    [class]="'notification-item__dot notification-item__dot--' + item.tone"
                    aria-hidden="true"
                  ></span>
                  <div class="notification-item__body">
                    <strong>{{ item.title }}</strong>
                    <p>{{ item.message }}</p>
                    <time [attr.datetime]="item.createdAt">{{ item.createdAt | abidjanDate }}</time>
                  </div>
                  @if (!item.read) {
                    <button
                      type="button"
                      class="pd-icon-btn"
                      [attr.aria-label]="'Marquer comme lu : ' + item.title"
                      (click)="markRead(item.id)"
                    >
                      <pdref-icon name="check" size="sm" />
                    </button>
                  }
                </li>
              }
            </ul>
          }
        </section>
      }
    </div>
  `,
  styleUrl: './notification-center.component.scss',
})
export class NotificationCenterComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly service = inject(NotificationCenterService);
  readonly open = signal(false);

  toggle(): void {
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  markRead(id: string): void {
    this.service.markRead(id);
  }

  markAllRead(): void {
    this.service.markAllRead();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}

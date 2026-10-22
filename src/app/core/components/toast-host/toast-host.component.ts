import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../services/notifications/notification.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'pdref-toast-host',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-host" aria-live="polite" aria-atomic="false">
      @for (toast of notifications.toasts(); track toast.id) {
        <section
          class="toast"
          [class]="'toast toast--' + toast.tone"
          [attr.role]="toast.tone === 'error' ? 'alert' : 'status'"
        >
          <span class="toast__icon" aria-hidden="true">
            <pdref-icon
              [name]="
                toast.tone === 'success'
                  ? 'check'
                  : toast.tone === 'warning'
                    ? 'alert-triangle'
                    : toast.tone === 'error'
                      ? 'alert-circle'
                      : 'info'
              "
            />
          </span>

          <div class="toast__body">
            <strong>{{ toast.title }}</strong>
            <p>{{ toast.message }}</p>
            @if (toast.code || toast.traceId || toast.reference) {
              <dl class="toast__meta">
                @if (toast.code) {
                  <div>
                    <dt>Code</dt>
                    <dd>{{ toast.code }}</dd>
                  </div>
                }
                @if (toast.traceId) {
                  <div>
                    <dt>Trace</dt>
                    <dd>{{ toast.traceId }}</dd>
                  </div>
                }
                @if (toast.reference) {
                  <div>
                    <dt>Reference</dt>
                    <dd>{{ toast.reference }}</dd>
                  </div>
                }
              </dl>
            }
          </div>

          <button
            type="button"
            class="pd-icon-btn toast__close"
            aria-label="Fermer la notification"
            (click)="notifications.dismiss(toast.id)"
          >
            <pdref-icon name="close" size="sm" />
          </button>
        </section>
      }
    </div>
  `,
  styleUrl: './toast-host.component.scss',
})
export class ToastHostComponent {
  readonly notifications = inject(NotificationService);
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmHostComponent } from './core/components/confirm-host/confirm-host.component';
import { SkipLinkComponent } from './core/components/skip-link/skip-link.component';
import { ToastHostComponent } from './core/components/toast-host/toast-host.component';
import { UploadProgressComponent } from './core/components/upload-progress/upload-progress.component';
import { AppUpdateService } from './core/services/bootstrap/app-update.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    SkipLinkComponent,
    ToastHostComponent,
    UploadProgressComponent,
    ConfirmHostComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdref-skip-link />
    <router-outlet />
    <pdref-toast-host />
    <pdref-upload-progress />
    <pdref-confirm-host />
  `,
})
export class App {
  private readonly update = inject(AppUpdateService);
}

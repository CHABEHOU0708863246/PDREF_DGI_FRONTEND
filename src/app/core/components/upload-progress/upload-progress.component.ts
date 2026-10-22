import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UploadProgressService } from '../../services/upload/upload-progress.service';

@Component({
  selector: 'pdref-upload-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (progress.active()) {
      <div
        class="upload-progress"
        role="progressbar"
        aria-label="Envoi en cours"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-valuenow]="progress.value()"
      >
        <span class="upload-progress__bar" [style.width.%]="progress.value()"></span>
      </div>
    }
  `,
  styleUrl: './upload-progress.component.scss',
})
export class UploadProgressComponent {
  readonly progress = inject(UploadProgressService);
}

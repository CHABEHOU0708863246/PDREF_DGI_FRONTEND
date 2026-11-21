import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { ApiProblemDetails } from '../../core/models/common/api-problem.model';
import type { FileGroup, FilePolicy } from '../../core/models/files/file.model';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { StatePanelComponent } from '../../core/components/state-panel/state-panel.component';
import { UploadFieldComponent } from '../../core/components/upload-field/upload-field.component';
import { UploadProgressComponent } from '../../core/components/upload-progress/upload-progress.component';
import { SecureDownloadDirective } from '../../core/directives/secure-download.directive';
import { CorrelationService } from '../../core/services/correlation/correlation.service';
import { FilesGateway } from '../../core/services/files/files.gateway';
import { UploadProgressService } from '../../core/services/upload/upload-progress.service';
import { normalizeProblem } from '../../core/utils/problem';
import { IconComponent } from '../../core/components/icon/icon.component';
import { RowActionsComponent } from '../../core/components/row-actions/row-actions.component';

@Component({
  selector: 'pdref-files-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    StatePanelComponent,
    UploadFieldComponent,
    UploadProgressComponent,
    SecureDownloadDirective,
    IconComponent,
    RowActionsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './files-page.component.html',
  styleUrl: './files-page.component.scss',
})
export class FilesPageComponent {
  private readonly gateway = inject(FilesGateway);
  private readonly progress = inject(UploadProgressService);
  private readonly correlation = inject(CorrelationService);

  readonly policy = signal<FilePolicy | null>(null);
  readonly files = signal<FileGroup[]>([]);
  readonly selected = signal<File[]>([]);
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly problem = signal<ApiProblemDetails | null>(null);
  readonly message = signal<string | null>(null);
  readonly canUpload = computed(() => this.policy() !== null);
  readonly selectedCount = computed(() => this.selected().length);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.gateway.policy().subscribe({
      next: (policy) => {
        this.policy.set(policy);
        this.gateway.list().subscribe({
          next: (files) => {
            this.files.set(files);
            this.loading.set(false);
          },
          error: (error: unknown) => {
            this.loading.set(false);
            this.problem.set(normalizeProblem(error, this.correlation.last));
          },
        });
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  select(files: readonly File[]): void {
    this.selected.set([...files]);
    this.problem.set(null);
  }

  upload(): void {
    const files = this.selected();
    if (files.length === 0 || this.uploading()) {
      return;
    }

    this.uploading.set(true);
    this.problem.set(null);
    this.progress.start();
    this.uploadNext(files, 0);
  }

  download(versionId: string): void {
    // La directive s'occupe du telechargement et de la revocation de l'URL.
    void versionId;
  }

  remove(file: FileGroup): void {
    const version = file.currentFile;
    if (!version) {
      return;
    }
    this.gateway.delete(version.id).subscribe({
      next: () => {
        this.message.set('Fichier marque comme supprime.');
        this.load();
      },
      error: (error: unknown) => this.problem.set(normalizeProblem(error, this.correlation.last)),
    });
  }

  replace(group: FileGroup, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.uploading.set(true);
    this.progress.start();
    this.gateway.replace(group.id, file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.progress.finish();
        this.message.set('Nouvelle version creee ; l ancienne est conservee.');
        this.load();
      },
      error: (error: unknown) => {
        this.uploading.set(false);
        this.progress.reset();
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
    });
  }

  formatSize(value: number): string {
    if (value < 1024 * 1024) {
      return `${Math.max(1, Math.round(value / 1024))} Ko`;
    }
    return `${(value / (1024 * 1024)).toFixed(1)} Mo`;
  }

  private uploadNext(files: readonly File[], index: number): void {
    if (index >= files.length) {
      this.uploading.set(false);
      this.progress.finish();
      this.selected.set([]);
      this.message.set('Fichiers televerses et valides.');
      this.load();
      return;
    }

    this.gateway.upload(files[index]).subscribe({
      next: (value) => this.progress.set(value),
      error: (error: unknown) => {
        this.uploading.set(false);
        this.progress.reset();
        this.problem.set(normalizeProblem(error, this.correlation.last));
      },
      complete: () => this.uploadNext(files, index + 1),
    });
  }
}

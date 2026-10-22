import type { OnDestroy } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'pdref-upload-field',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="upload-field">
      @if (label()) {
        <span class="pd-label">{{ label() }}</span>
      }

      <button
        type="button"
        class="upload-zone"
        [class.upload-zone--drag]="dragging()"
        [disabled]="disabled()"
        (click)="fileInput.click()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave()"
        (drop)="onDrop($event)"
      >
        <pdref-icon name="upload" size="lg" />
        <strong>Choisir un fichier</strong>
        @if (hint()) {
          <small>{{ hint() }}</small>
        }
      </button>

      <input
        #fileInput
        class="pd-visually-hidden"
        type="file"
        [attr.aria-label]="label() || 'Choisir un fichier'"
        [attr.accept]="accept()"
        [attr.multiple]="multiple()"
        [disabled]="disabled()"
        (change)="onFileInput($event)"
      />

      @if (error()) {
        <p class="pd-error" role="alert">{{ error() }}</p>
      }

      @if (files().length > 0) {
        <ul class="file-list">
          @for (file of files(); track file; let index = $index) {
            <li class="file-item">
              @if (previewFor(file); as preview) {
                <img class="file-item__preview" [src]="preview" alt="" />
              } @else {
                <span class="file-item__icon"><pdref-icon name="file" /></span>
              }
              <span class="file-item__name">{{ file.name }}</span>
              <button
                type="button"
                class="pd-icon-btn"
                [attr.aria-label]="'Retirer ' + file.name"
                (click)="remove(index)"
              >
                <pdref-icon name="trash" size="sm" />
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styleUrl: './upload-field.component.scss',
})
export class UploadFieldComponent implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly previews = new Map<File, string>();

  readonly label = input('');
  readonly hint = input('');
  readonly accept = input('');
  readonly multiple = input(true);
  readonly maxFiles = input<number | null>(null);
  readonly maxSizeBytes = input<number | null>(null);
  readonly disabled = input(false);

  readonly filesSelected = output<readonly File[]>();
  readonly cleared = output<void>();

  readonly files = signal<readonly File[]>([]);
  readonly error = signal<string | null>(null);
  readonly dragging = signal(false);

  ngOnDestroy(): void {
    this.revokePreviews();
  }

  onFileInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.acceptFiles(Array.from(target.files ?? []));
    target.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled()) {
      this.dragging.set(true);
    }
  }

  onDragLeave(): void {
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (!this.disabled()) {
      this.acceptFiles(Array.from(event.dataTransfer?.files ?? []));
    }
  }

  remove(index: number): void {
    const current = [...this.files()];
    const [removed] = current.splice(index, 1);
    if (removed) {
      this.revokePreview(removed);
    }
    this.files.set(current);
    this.filesSelected.emit(current);
    if (current.length === 0) {
      this.cleared.emit();
    }
  }

  previewFor(file: File): string | null {
    if (!isPlatformBrowser(this.platformId) || !file.type.startsWith('image/')) {
      return null;
    }

    let preview = this.previews.get(file);
    if (!preview) {
      preview = URL.createObjectURL(file);
      this.previews.set(file, preview);
    }
    return preview;
  }

  private acceptFiles(incoming: readonly File[]): void {
    this.error.set(null);

    if (incoming.length === 0) {
      return;
    }

    const maxFiles = this.maxFiles();
    if (maxFiles !== null && this.files().length + incoming.length > maxFiles) {
      this.error.set(`Vous pouvez joindre au maximum ${maxFiles} fichier(s).`);
      return;
    }

    const maxSize = this.maxSizeBytes();
    const oversized = incoming.find((file) => maxSize !== null && file.size > maxSize);
    if (oversized) {
      this.error.set(`Le fichier "${oversized.name}" depasse la taille autorisee.`);
      return;
    }

    const wrongType = incoming.find((file) => !this.matchesAccept(file));
    if (wrongType) {
      this.error.set(`Le format du fichier "${wrongType.name}" n'est pas autorise.`);
      return;
    }

    const next = [...this.files(), ...incoming];
    this.files.set(next);
    this.filesSelected.emit(next);
  }

  private matchesAccept(file: File): boolean {
    const accept = this.accept().trim();
    if (!accept) {
      return true;
    }

    return accept.split(',').some((raw) => {
      const token = raw.trim().toLowerCase();
      if (!token) {
        return false;
      }
      if (token.endsWith('/*')) {
        return file.type.toLowerCase().startsWith(token.slice(0, -1));
      }
      if (token.startsWith('.')) {
        return file.name.toLowerCase().endsWith(token);
      }
      return file.type.toLowerCase() === token;
    });
  }

  private revokePreview(file: File): void {
    const preview = this.previews.get(file);
    if (preview) {
      URL.revokeObjectURL(preview);
      this.previews.delete(file);
    }
  }

  private revokePreviews(): void {
    for (const preview of this.previews.values()) {
      URL.revokeObjectURL(preview);
    }
    this.previews.clear();
  }
}

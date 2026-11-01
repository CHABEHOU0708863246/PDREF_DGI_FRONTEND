import { Directive, HostListener, inject, input } from '@angular/core';
import { FilesGateway } from '../services/files/files.gateway';

@Directive({
  selector: '[pdrefSecureDownload]',
  standalone: true,
})
export class SecureDownloadDirective {
  private readonly gateway = inject(FilesGateway);
  readonly versionId = input.required<string>({ alias: 'pdrefSecureDownload' });

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    event.preventDefault();
    const versionId = this.versionId();
    if (!versionId) {
      return;
    }

    this.gateway.download(versionId).subscribe({
      next: ({ blob, fileName }) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName ?? 'fichier';
        anchor.rel = 'noopener';
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      },
    });
  }
}

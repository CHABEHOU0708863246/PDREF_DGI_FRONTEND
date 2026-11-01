import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { FilesGateway } from '../../core/services/files/files.gateway';
import { FilesPageComponent } from './files-page.component';

const policy = {
  maximumFiles: 10,
  maximumFileSizeBytes: 2 * 1024 * 1024,
  maximumTotalSizeBytes: 5 * 1024 * 1024,
  minimumPdfCount: 0,
  allowedContentTypes: ['application/pdf'],
};

const group = {
  id: 'g1',
  ownerType: null,
  ownerId: null,
  currentVersion: 1,
  currentFile: {
    id: 'v1',
    fileGroupId: 'g1',
    versionNumber: 1,
    originalName: 'facture.pdf',
    detectedContentType: 'application/pdf',
    sizeBytes: 1200,
    sha256: 'hash',
    status: 'PROPRE',
    scanStatus: 'PROPRE',
    createdAt: '2026-11-01T00:00:00Z',
  },
};

function setup() {
  const gateway = {
    policy: vi.fn(() => of(policy)),
    list: vi.fn(() => of([group])),
    upload: vi.fn(() => of(100)),
    replace: vi.fn(() => of(group)),
    download: vi.fn(() => of({ blob: new Blob(), fileName: 'facture.pdf' })),
    delete: vi.fn(() => of({})),
  };
  TestBed.configureTestingModule({
    imports: [FilesPageComponent],
    providers: [{ provide: FilesGateway, useValue: gateway }],
  });
  return { fixture: TestBed.createComponent(FilesPageComponent), gateway };
}

describe('FilesPageComponent', () => {
  it('charge la politique et la liste', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    expect(gateway.policy).toHaveBeenCalledOnce();
    expect(gateway.list).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.files()).toHaveLength(1);
  });

  it('envoie les fichiers selectionnes', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    fixture.componentInstance.select([
      new File(['pdf'], 'facture.pdf', { type: 'application/pdf' }),
    ]);
    fixture.componentInstance.upload();
    expect(gateway.upload).toHaveBeenCalledOnce();
  });

  it('supprime logiquement et remplace un fichier', () => {
    const { fixture, gateway } = setup();
    fixture.detectChanges();
    fixture.componentInstance.remove(group);
    expect(gateway.delete).toHaveBeenCalledWith('v1');
    const file = new File(['pdf'], 'nouveau.pdf', { type: 'application/pdf' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    fixture.componentInstance.replace(group, { target: input } as unknown as Event);
    expect(gateway.replace).toHaveBeenCalledWith('g1', file);
  });

  it('formate les tailles', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    expect(fixture.componentInstance.formatSize(1024)).toBe('1 Ko');
    expect(fixture.componentInstance.formatSize(2 * 1024 * 1024)).toBe('2.0 Mo');
  });
});

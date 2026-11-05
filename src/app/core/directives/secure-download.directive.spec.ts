import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { FilesGateway } from '../services/files/files.gateway';
import { SecureDownloadDirective } from './secure-download.directive';

@Component({
  standalone: true,
  imports: [SecureDownloadDirective],
  template: '<button type="button" [pdrefSecureDownload]="\'v1\'">Telecharger</button>',
})
class Host {}

describe('SecureDownloadDirective', () => {
  it('telecharge le blob et revoque l URL', () => {
    vi.useFakeTimers();
    const download = vi.fn(() => of({ blob: new Blob(['x']), fileName: 'facture.pdf' }));
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [{ provide: FilesGateway, useValue: { download } }],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(download).toHaveBeenCalledWith('v1');
    expect(anchorClick).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
    vi.useRealTimers();
    anchorClick.mockRestore();
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });
});

import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { UploadProgressService } from './upload-progress.service';

describe('UploadProgressService', () => {
  it('borne la progression et se termine', () => {
    TestBed.configureTestingModule({ providers: [UploadProgressService] });
    const service = TestBed.inject(UploadProgressService);
    service.start();
    expect(service.active()).toBe(true);
    expect(service.value()).toBe(0);

    service.set(150);
    expect(service.value()).toBe(100);
    service.set(-10);
    expect(service.value()).toBe(0);

    service.finish();
    expect(service.active()).toBe(false);
    expect(service.value()).toBe(100);

    service.reset();
    expect(service.active()).toBe(false);
    expect(service.value()).toBe(0);
  });
});

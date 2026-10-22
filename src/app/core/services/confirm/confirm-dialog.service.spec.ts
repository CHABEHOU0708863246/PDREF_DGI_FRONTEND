import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  it('resout la promesse avec la decision', async () => {
    TestBed.configureTestingModule({ providers: [ConfirmDialogService] });
    const service = TestBed.inject(ConfirmDialogService);

    const promise = service.confirm({ title: 'T', message: 'M' });
    expect(service.request()?.title).toBe('T');
    service.resolve(true);

    await expect(promise).resolves.toBe(true);
    expect(service.request()).toBeNull();
  });

  it('annule une demande precedente', async () => {
    TestBed.configureTestingModule({ providers: [ConfirmDialogService] });
    const service = TestBed.inject(ConfirmDialogService);

    const first = service.confirm({ title: 'A', message: 'A' });
    const second = service.confirm({ title: 'B', message: 'B' });
    service.resolve(false);

    await expect(first).resolves.toBe(false);
    await expect(second).resolves.toBe(false);
  });
});

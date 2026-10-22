import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { StorageService } from './storage.service';

function create(platform: 'browser' | 'server'): StorageService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [StorageService, { provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(StorageService);
}

describe('StorageService', () => {
  it('autorise uniquement les cles non sensibles', () => {
    const service = create('browser');
    service.set('pdref_theme', 'dark');
    expect(service.get('pdref_theme')).toBe('dark');
    service.remove('pdref_theme');
    expect(service.get('pdref_theme')).toBeNull();
  });

  it('refuse tout token ou donnee personnelle', () => {
    const service = create('browser');
    expect(() => service.set('refresh_token', 'secret')).toThrow();
    expect(() => service.set('access_token', 'secret')).toThrow();
    expect(() => service.set('ncc', '1234567A')).toThrow();
    expect(service.get('email')).toBeNull();
  });

  it('est inactif cote serveur', () => {
    const service = create('server');
    expect(service.get('pdref_theme')).toBeNull();
    expect(() => service.set('pdref_theme', 'dark')).not.toThrow();
  });

  it('ne casse pas si le stockage leve', () => {
    const service = create('browser');
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(service.get('pdref_theme')).toBeNull();
    spy.mockRestore();
  });
});

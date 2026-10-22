import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageService } from '../storage/storage.service';
import { ThemeService } from './theme.service';

function create(platform: 'browser' | 'server'): ThemeService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [ThemeService, StorageService, { provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(ThemeService);
}

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('applique et memorise le theme', () => {
    const service = create('browser');
    service.setMode('dark');
    expect(service.mode()).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    service.setMode('light');
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('bascule et revient au systeme', () => {
    const service = create('browser');
    service.setMode('light');
    service.toggle();
    expect(service.mode()).toBe('dark');
    service.useSystem();
    expect(service.mode()).toBe('system');
  });

  it('est inactif cote serveur', () => {
    const service = create('server');
    service.setMode('dark');
    expect(service.mode()).toBe('dark');
    expect(service.isDark()).toBe(false);
  });

  it('suit la preference systeme', () => {
    const media = window.matchMedia as unknown as ReturnType<typeof vi.fn>;
    media.mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const service = create('browser');
    expect(service.mode()).toBe('system');
    expect(service.isDark()).toBe(true);
  });
});

import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { StorageService } from '../storage/storage.service';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'pdref_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private media: MediaQueryList | null = null;

  readonly mode = signal<ThemeMode>('system');
  readonly isDark = signal(false);

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    const stored = this.storage.get(THEME_KEY);
    this.mode.set(stored === 'light' || stored === 'dark' ? stored : 'system');
    this.media = window.matchMedia('(prefers-color-scheme: dark)');
    this.media.addEventListener?.('change', () => this.apply());
    this.apply();
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    this.storage.set(THEME_KEY, mode);
    this.apply();
  }

  toggle(): void {
    this.setMode(this.isDark() ? 'light' : 'dark');
  }

  useSystem(): void {
    this.setMode('system');
  }

  private apply(): void {
    if (!this.isBrowser || typeof document === 'undefined') {
      return;
    }

    const prefersDark = this.media?.matches ?? false;
    const dark = this.mode() === 'dark' || (this.mode() === 'system' && prefersDark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    this.isDark.set(dark);
  }
}

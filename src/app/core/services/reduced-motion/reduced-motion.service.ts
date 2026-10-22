import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ReducedMotionService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private media: MediaQueryList | null = null;

  readonly reduced = signal(false);

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    this.media = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced.set(this.media.matches);
    this.media.addEventListener?.('change', () => this.reduced.set(this.media?.matches ?? false));
  }
}

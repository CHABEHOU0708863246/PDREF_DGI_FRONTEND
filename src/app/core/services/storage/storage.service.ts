import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const ALLOWED_KEYS = new Set(['pdref_theme', 'pdref_ui_prefs']);

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  get(key: string): string | null {
    if (!this.isBrowser || !ALLOWED_KEYS.has(key)) {
      return null;
    }

    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    if (!ALLOWED_KEYS.has(key)) {
      throw new Error(`Cle de stockage non autorisee : ${key}`);
    }

    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(key, value);
    } catch {
      // Stockage indisponible : la preference reste en memoire pour la session.
    }
  }

  remove(key: string): void {
    if (!this.isBrowser || !ALLOWED_KEYS.has(key)) {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore.
    }
  }
}

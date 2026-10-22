import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ReducedMotionService } from './reduced-motion.service';

function setup(platform: 'browser' | 'server') {
  TestBed.configureTestingModule({
    providers: [ReducedMotionService, { provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(ReducedMotionService);
}

describe('ReducedMotionService', () => {
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

    expect(setup('browser').reduced()).toBe(true);
  });

  it('est faux cote serveur', () => {
    expect(setup('server').reduced()).toBe(false);
  });
});

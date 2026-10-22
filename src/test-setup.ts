import { vi } from 'vitest';

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

if (typeof HTMLDialogElement !== 'undefined') {
  if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    HTMLDialogElement.prototype.showModal = function showModal(): void {
      this.open = true;
    };
  }

  if (typeof HTMLDialogElement.prototype.close !== 'function') {
    HTMLDialogElement.prototype.close = function close(): void {
      this.open = false;
    };
  }
}

if (typeof URL !== 'undefined') {
  if (typeof URL.createObjectURL !== 'function') {
    URL.createObjectURL = vi.fn(() => 'blob:pdref-demo');
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    URL.revokeObjectURL = vi.fn();
  }
}

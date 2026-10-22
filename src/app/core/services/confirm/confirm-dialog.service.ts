import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  details?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly requestState = signal<ConfirmRequest | null>(null);
  private resolver: ((value: boolean) => void) | null = null;

  readonly request = this.requestState.asReadonly();

  confirm(request: ConfirmRequest): Promise<boolean> {
    if (this.resolver) {
      this.resolver(false);
    }

    this.requestState.set(request);
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  resolve(value: boolean): void {
    const resolver = this.resolver;
    this.resolver = null;
    this.requestState.set(null);
    resolver?.(value);
  }
}

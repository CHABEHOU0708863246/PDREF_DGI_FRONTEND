import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UploadProgressService {
  private readonly activeState = signal(false);
  private readonly valueState = signal(0);

  readonly active = this.activeState.asReadonly();
  readonly value = this.valueState.asReadonly();

  start(): void {
    this.activeState.set(true);
    this.valueState.set(0);
  }

  set(value: number): void {
    this.valueState.set(Math.min(100, Math.max(0, Math.round(value))));
  }

  finish(): void {
    this.valueState.set(100);
    this.activeState.set(false);
  }

  reset(): void {
    this.activeState.set(false);
    this.valueState.set(0);
  }
}

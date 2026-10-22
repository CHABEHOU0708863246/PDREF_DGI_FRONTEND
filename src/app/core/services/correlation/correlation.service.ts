import { Injectable, signal } from '@angular/core';
import { newCorrelationId } from '../../utils/correlation';

@Injectable({ providedIn: 'root' })
export class CorrelationService {
  private readonly lastId = signal<string | null>(null);

  get last(): string | null {
    return this.lastId();
  }

  next(): string {
    const value = newCorrelationId();
    this.lastId.set(value);
    return value;
  }

  set(value: string): void {
    this.lastId.set(value);
  }
}

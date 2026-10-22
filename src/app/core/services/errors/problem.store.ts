import { Injectable, signal } from '@angular/core';
import type { ApiProblemDetails } from '../../models/common/api-problem.model';

@Injectable({ providedIn: 'root' })
export class ProblemStore {
  private readonly state = signal<ApiProblemDetails | null>(null);

  readonly lastProblem = this.state.asReadonly();

  set(problem: ApiProblemDetails): void {
    this.state.set(problem);
  }

  clear(): void {
    this.state.set(null);
  }
}

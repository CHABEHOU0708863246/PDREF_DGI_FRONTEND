import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import { delay, of } from 'rxjs';

export interface LookupOption {
  id: string;
  label: string;
  sub?: string;
}

export interface ContribuableLookup {
  search(term: string, limit: number): Observable<readonly LookupOption[]>;
}

export const CONTRIBUABLE_LOOKUP = new InjectionToken<ContribuableLookup>('CONTRIBUABLE_LOOKUP');

/**
 * Implementation de demonstration L2 : aucune API metier, aucun NCC reel.
 * L8 remplacera ce provider par l implementation HTTP.
 */
export class DemoContribuableLookup implements ContribuableLookup {
  private readonly options: readonly LookupOption[] = [
    { id: 'demo-1', label: 'Contribuable demonstration A', sub: 'NCC demo' },
    { id: 'demo-2', label: 'Contribuable demonstration B', sub: 'NCC demo' },
    { id: 'demo-3', label: 'Contribuable demonstration C', sub: 'NCC demo' },
  ];

  search(term: string, limit: number): Observable<readonly LookupOption[]> {
    const normalized = term.trim().toLowerCase();
    const matches = this.options
      .filter((option) => option.label.toLowerCase().includes(normalized))
      .slice(0, limit);
    return of(matches).pipe(delay(250));
  }
}

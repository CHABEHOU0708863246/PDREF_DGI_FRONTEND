import { InjectionToken, Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { delay, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import type { ApiResponse } from '../../models/common/api-response.model';

export interface LookupOption {
  id: string;
  label: string;
  sub?: string;
}

export interface ContribuableLookup {
  search(term: string, limit: number): Observable<readonly LookupOption[]>;
}

export const CONTRIBUABLE_LOOKUP = new InjectionToken<ContribuableLookup>('CONTRIBUABLE_LOOKUP');

interface LookupApiItem {
  id: string;
  raisonSociale: string;
  nccMasque: string;
}

@Injectable({ providedIn: 'root' })
export class HttpContribuableLookup implements ContribuableLookup {
  private readonly http = inject(HttpClient);

  search(term: string, limit: number): Observable<readonly LookupOption[]> {
    return this.http
      .get<ApiResponse<LookupApiItem[]>>(`${environment.apiUrl}/api/v1/contribuables/lookup`, {
        params: { term },
      })
      .pipe(
        map((response) =>
          response.data.slice(0, limit).map((item) => ({
            id: item.id,
            label: item.raisonSociale,
            sub: item.nccMasque,
          })),
        ),
      );
  }
}

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

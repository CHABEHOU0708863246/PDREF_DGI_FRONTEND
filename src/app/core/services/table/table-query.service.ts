import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_TABLE_STATE, type TableState } from '../../models/table/table.model';

const ALLOWED_KEYS = ['page', 'pageSize', 'sort', 'dir', 'q', 'tone', 'from', 'to'] as const;
const FILTER_KEYS = ['q', 'tone', 'from', 'to'] as const;
const SENSITIVE_KEYS = new Set([
  'ncc',
  'email',
  'telephone',
  'phone',
  'nom',
  'prenom',
  'raisonSociale',
  'adresse',
]);

@Injectable({ providedIn: 'root' })
export class TableQueryService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  read(): TableState {
    const params = this.route.snapshot.queryParamMap;
    const page = Number(params.get('page') ?? DEFAULT_TABLE_STATE.page);
    const pageSize = Number(params.get('pageSize') ?? DEFAULT_TABLE_STATE.pageSize);
    const sort = params.get('sort');
    const dir = params.get('dir');
    const filters: Record<string, string> = {};

    for (const key of FILTER_KEYS) {
      const value = params.get(key);
      if (value) {
        filters[key] = value;
      }
    }

    return {
      page: Number.isFinite(page) && page > 0 ? page : DEFAULT_TABLE_STATE.page,
      pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : DEFAULT_TABLE_STATE.pageSize,
      sort,
      direction: dir === 'desc' ? 'desc' : 'asc',
      filters,
    };
  }

  write(state: TableState): void {
    this.assertNoSensitive(state.filters);

    const current = this.route.snapshot.queryParamMap;
    const queryParams: Record<string, string | number> = {};

    for (const key of ALLOWED_KEYS) {
      if (key === 'page' || key === 'pageSize' || key === 'sort' || key === 'dir') {
        continue;
      }
      const value = current.get(key);
      if (value) {
        queryParams[key] = value;
      }
    }

    queryParams['page'] = state.page;
    queryParams['pageSize'] = state.pageSize;
    if (state.sort) {
      queryParams['sort'] = state.sort;
      queryParams['dir'] = state.direction;
    }

    for (const [key, value] of Object.entries(state.filters)) {
      if ((FILTER_KEYS as readonly string[]).includes(key)) {
        queryParams[key] = value;
      }
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true,
    });
  }

  private assertNoSensitive(filters: Record<string, string>): void {
    for (const key of Object.keys(filters)) {
      if (SENSITIVE_KEYS.has(key)) {
        throw new Error(`Filtre interdit dans l'URL : ${key}`);
      }
      if (!(FILTER_KEYS as readonly string[]).includes(key)) {
        throw new Error(`Filtre inconnu : ${key}`);
      }
    }
  }
}

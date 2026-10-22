import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import type { ParamMap } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { TableQueryService } from './table-query.service';

function paramMap(values: Record<string, string>): ParamMap {
  return {
    keys: Object.keys(values),
    has: (key: string) => key in values,
    get: (key: string) => values[key] ?? null,
    getAll: (key: string) => (values[key] ? [values[key]] : []),
    get keysArray() {
      return Object.keys(values);
    },
  } as ParamMap;
}

function setup(values: Record<string, string> = {}) {
  const navigate = vi.fn().mockResolvedValue(true);
  const route = {
    snapshot: {
      queryParamMap: paramMap(values),
      queryParams: values,
    },
  };

  TestBed.configureTestingModule({
    providers: [
      TableQueryService,
      { provide: Router, useValue: { navigate } },
      { provide: ActivatedRoute, useValue: route },
    ],
  });

  return { service: TestBed.inject(TableQueryService), navigate };
}

describe('TableQueryService', () => {
  it('lit un etat valide depuis l URL', () => {
    const { service } = setup({
      page: '2',
      pageSize: '25',
      sort: 'reference',
      dir: 'desc',
      q: 'demo',
    });

    expect(service.read()).toEqual({
      page: 2,
      pageSize: 25,
      sort: 'reference',
      direction: 'desc',
      filters: { q: 'demo' },
    });
  });

  it('applique des valeurs par defaut', () => {
    const { service } = setup();
    expect(service.read().page).toBe(1);
    expect(service.read().pageSize).toBe(10);
  });

  it('ecrit uniquement les cles autorisees', () => {
    const { service, navigate } = setup({ page: '1', q: 'old' });
    service.write({
      page: 3,
      pageSize: 50,
      sort: 'label',
      direction: 'asc',
      filters: { q: 'demo' },
    });

    expect(navigate).toHaveBeenCalledOnce();
    const args = navigate.mock.calls[0]?.[1] as { queryParams: Record<string, unknown> };
    expect(args.queryParams).not.toHaveProperty('ncc');
    expect(args.queryParams['page']).toBe(3);
    expect(args.queryParams['sort']).toBe('label');
  });

  it('refuse les filtres PII et inconnus', () => {
    const { service } = setup();
    expect(() =>
      service.write({ page: 1, pageSize: 10, sort: null, direction: 'asc', filters: { ncc: '1' } }),
    ).toThrow();
    expect(() =>
      service.write({
        page: 1,
        pageSize: 10,
        sort: null,
        direction: 'asc',
        filters: { email: 'a' },
      }),
    ).toThrow();
  });
});

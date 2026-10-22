import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { BreadcrumbService } from './breadcrumb.service';

describe('BreadcrumbService', () => {
  it('construit le fil depuis data.breadcrumb', () => {
    const events = new Subject<NavigationEnd>();
    const child = {
      firstChild: null,
      snapshot: {
        url: [{ path: 'dashboard' }],
        data: { breadcrumb: 'Tableau de bord' },
      },
    };
    const root = { firstChild: child };
    const route = { root } as unknown as ActivatedRoute;

    TestBed.configureTestingModule({
      providers: [
        BreadcrumbService,
        { provide: Router, useValue: { events } },
        { provide: ActivatedRoute, useValue: route },
      ],
    });

    const service = TestBed.inject(BreadcrumbService);
    expect(service.items()).toHaveLength(1);
    expect(service.items()[0]?.label).toBe('Tableau de bord');
    expect(service.items()[0]?.url).toBe('/dashboard');

    events.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    expect(service.items()).toHaveLength(1);
  });
});

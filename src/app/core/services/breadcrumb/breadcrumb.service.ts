import { Injectable, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import type { BreadcrumbItem } from '../../models/common/breadcrumb.model';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly state = signal<readonly BreadcrumbItem[]>([]);

  readonly items = this.state.asReadonly();

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.refresh());
    this.refresh();
  }

  private refresh(): void {
    const items: BreadcrumbItem[] = [];
    const segments: string[] = [];
    let current = this.route.root;

    while (current?.firstChild) {
      current = current.firstChild;
      if (!current.snapshot) {
        break;
      }

      const segment = current.snapshot.url.map((part) => part.path).join('/');
      if (segment) {
        segments.push(segment);
      }

      const label = current.snapshot.data['breadcrumb'];
      // Une route enfant sans libelle propre herite des donnees de son parent :
      // on n'affiche pas deux fois le meme niveau (« Tableau de bord / Tableau de bord »).
      const duplicate = items.length > 0 && items[items.length - 1]?.label === label;
      if (typeof label === 'string' && label.length > 0 && !duplicate) {
        items.push({
          label,
          url: segments.length > 0 ? `/${segments.join('/')}` : undefined,
        });
      }
    }

    this.state.set(items);
  }
}

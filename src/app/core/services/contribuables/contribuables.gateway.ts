import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  Contribuable,
  ContribuablePage,
  ContribuableQuality,
  ContribuableQuery,
  ContribuableWrite,
} from '../../models/contribuables/contribuable.model';

export interface ExportResult {
  blob: Blob;
  fileName: string;
}

@Injectable({ providedIn: 'root' })
export class ContribuablesGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/contribuables`;

  list(query: ContribuableQuery): Observable<ContribuablePage> {
    return this.http
      .get<ApiResponse<ContribuablePage>>(this.base, { params: this.params(query) })
      .pipe(map((response) => response.data));
  }

  quality(): Observable<ContribuableQuality> {
    return this.http
      .get<ApiResponse<ContribuableQuality>>(`${this.base}/qualite`)
      .pipe(map((response) => response.data));
  }

  get(id: string, revealPii = false): Observable<Contribuable> {
    const params = revealPii ? new HttpParams().set('revealPii', 'true') : undefined;
    return this.http
      .get<ApiResponse<Contribuable>>(`${this.base}/${encodeURIComponent(id)}`, { params })
      .pipe(map((response) => response.data));
  }

  create(request: ContribuableWrite): Observable<Contribuable> {
    return this.http
      .post<ApiResponse<Contribuable>>(this.base, request)
      .pipe(map((response) => response.data));
  }

  update(id: string, request: ContribuableWrite): Observable<Contribuable> {
    return this.http
      .put<ApiResponse<Contribuable>>(`${this.base}/${encodeURIComponent(id)}`, request)
      .pipe(map((response) => response.data));
  }

  archive(id: string): Observable<unknown> {
    return this.http.post(`${this.base}/${encodeURIComponent(id)}/archive`, null);
  }

  syncEImpots(id: string): Observable<unknown> {
    return this.http.post(`${this.base}/${encodeURIComponent(id)}/sync-eimpots`, null);
  }

  export(query: ContribuableQuery, format: 'csv' | 'xls'): Observable<ExportResult> {
    return this.http
      .get(`${this.base}/export`, {
        params: this.params({ ...query, page: 1, pageSize: 100 }).set('format', format),
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        map((response) => ({
          blob: response.body ?? new Blob(),
          fileName: this.fileName(response.headers.get('content-disposition'), format),
        })),
      );
  }

  private params(query: ContribuableQuery): HttpParams {
    let params = new HttpParams();
    const values: Record<string, string | number | boolean | null | undefined> = {
      search: query.search,
      ncc: query.ncc,
      systemeComptable: query.systemeComptable,
      secteur: query.secteur,
      sansEmail: query.sansEmail,
      sansTelephone: query.sansTelephone,
      nccHorsFormat: query.nccHorsFormat,
      includeArchived: query.includeArchived,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      sort: query.sort ?? 'raisonSociale',
      direction: query.direction ?? 'asc',
    };
    for (const [key, value] of Object.entries(values)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  private fileName(header: string | null, format: 'csv' | 'xls'): string {
    const match = header ? /filename="?([^";]+)"?/i.exec(header) : null;
    return match?.[1] ?? `contribuables.${format}`;
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type { AuditFilter, AuditPage } from '../../models/audit/audit.model';

@Injectable({ providedIn: 'root' })
export class HttpAuditGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/audit/events`;

  query(filter: AuditFilter): Observable<AuditPage> {
    return this.http
      .get<ApiResponse<AuditPage>>(this.base, { params: this.params(filter) })
      .pipe(map((response) => response.data));
  }

  export(filter: AuditFilter, format: 'csv' | 'json' = 'csv'): Observable<Blob> {
    const params = this.params(filter).set('format', format);
    return this.http.get(`${this.base}/export`, {
      params,
      responseType: 'blob',
    });
  }

  private params(filter: AuditFilter): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filter)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  AuditEvent,
  AuditExport,
  AuditExportRequest,
  AuditFilter,
  AuditIntegrity,
  AuditPage,
} from '../../models/audit/audit.model';

@Injectable({ providedIn: 'root' })
export class HttpAuditGateway {
  private readonly http = inject(HttpClient);
  private readonly root = `${environment.apiUrl}/api/v1/audit`;
  private readonly base = `${this.root}/events`;

  query(filter: AuditFilter): Observable<AuditPage> {
    return this.http
      .get<ApiResponse<AuditPage>>(this.base, { params: this.params(filter) })
      .pipe(map((response) => response.data));
  }

  detail(id: string): Observable<AuditEvent> {
    return this.http
      .get<ApiResponse<AuditEvent>>(`${this.base}/${id}`)
      .pipe(map((response) => response.data));
  }

  chronology(dossierNumber: string): Observable<AuditEvent[]> {
    return this.http
      .get<ApiResponse<AuditEvent[]>>(
        `${this.root}/dossiers/${encodeURIComponent(dossierNumber)}/chronologie`,
      )
      .pipe(map((response) => response.data));
  }

  integrity(filter: AuditFilter): Observable<AuditIntegrity> {
    return this.http
      .get<ApiResponse<AuditIntegrity>>(`${this.root}/integrite`, {
        params: this.params(filter),
      })
      .pipe(map((response) => response.data));
  }

  requestExport(filter: AuditFilter, format: 'CSV' | 'EXCEL'): Observable<AuditExport> {
    const body: AuditExportRequest = { ...filter, format };
    return this.http
      .post<ApiResponse<AuditExport>>(`${this.root}/exports`, body)
      .pipe(map((response) => response.data));
  }

  getExport(id: string): Observable<AuditExport> {
    return this.http
      .get<ApiResponse<AuditExport>>(`${this.root}/exports/${id}`)
      .pipe(map((response) => response.data));
  }

  downloadExport(id: string): Observable<Blob> {
    return this.http.get(`${this.root}/exports/${id}/download`, { responseType: 'blob' });
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

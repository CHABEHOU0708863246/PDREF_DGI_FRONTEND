import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type { CtfDetail, CtfListItem, CtfQuery } from '../../models/ctf/ctf.model';

@Injectable({ providedIn: 'root' })
export class CtfGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/ctf`;

  aActiver(query: CtfQuery = {}): Observable<CtfListItem[]> {
    return this.http
      .get<ApiResponse<CtfListItem[]>>(`${this.base}/a-activer`, { params: this.params(query) })
      .pipe(map((response) => response.data));
  }

  list(query: CtfQuery = {}): Observable<CtfListItem[]> {
    return this.http
      .get<ApiResponse<CtfListItem[]>>(this.base, { params: this.params(query) })
      .pipe(map((response) => response.data));
  }

  get(demandeId: string): Observable<CtfDetail> {
    return this.http
      .get<ApiResponse<CtfDetail>>(`${this.base}/${encodeURIComponent(demandeId)}`)
      .pipe(map((response) => response.data));
  }

  activer(demandeId: string): Observable<CtfDetail> {
    return this.http
      .post<ApiResponse<CtfDetail>>(`${this.base}/${encodeURIComponent(demandeId)}/activation`, {})
      .pipe(map((response) => response.data));
  }

  retourGudef(demandeId: string): Observable<CtfDetail> {
    return this.http
      .post<ApiResponse<CtfDetail>>(
        `${this.base}/${encodeURIComponent(demandeId)}/retour-gudef`,
        {},
      )
      .pipe(map((response) => response.data));
  }

  private params(query: CtfQuery): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return params;
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  DashboardAnalytique,
  DashboardKpis,
  DashboardNominatifPage,
  DashboardNominatifQuery,
  DashboardQualite,
  DashboardQuery,
} from '../../models/dashboard/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/dashboard`;

  kpis(query: DashboardQuery = {}): Observable<DashboardKpis> {
    return this.http
      .get<ApiResponse<DashboardKpis>>(`${this.base}/kpis`, { params: this.params(query) })
      .pipe(map((response) => response.data));
  }

  analytique(query: DashboardQuery = {}): Observable<DashboardAnalytique> {
    return this.http
      .get<ApiResponse<DashboardAnalytique>>(`${this.base}/analytique`, {
        params: this.params(query),
      })
      .pipe(map((response) => response.data));
  }

  nominatif(query: DashboardNominatifQuery = {}): Observable<DashboardNominatifPage> {
    return this.http
      .get<ApiResponse<DashboardNominatifPage>>(`${this.base}/nominatif`, {
        params: this.params(query),
      })
      .pipe(map((response) => response.data));
  }

  qualite(): Observable<DashboardQualite> {
    return this.http
      .get<ApiResponse<DashboardQualite>>(`${this.base}/qualite`)
      .pipe(map((response) => response.data));
  }

  private params(query: DashboardQuery | DashboardNominatifQuery): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}

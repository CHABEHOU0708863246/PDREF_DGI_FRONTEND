import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  AlertePage,
  AlerteQuery,
  AlerteStats,
  AlerteStatsQuery,
} from '../../models/alertes/alerte.model';

@Injectable({ providedIn: 'root' })
export class AlerteGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/alertes`;

  list(query: AlerteQuery = {}): Observable<AlertePage> {
    return this.http
      .get<ApiResponse<AlertePage>>(this.base, { params: this.params(query) })
      .pipe(map((response) => response.data));
  }

  stats(query: AlerteStatsQuery): Observable<AlerteStats> {
    return this.http
      .get<ApiResponse<AlerteStats>>(`${this.base}/stats`, { params: this.params(query) })
      .pipe(map((response) => response.data));
  }

  private params(query: AlerteQuery | AlerteStatsQuery): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}

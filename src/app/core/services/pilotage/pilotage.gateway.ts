import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type { PilotagePage, PilotageQuery, Workload } from '../../models/pilotage/pilotage.model';

@Injectable({ providedIn: 'root' })
export class PilotageGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/pilotage`;

  drilldown(query: PilotageQuery): Observable<PilotagePage> {
    return this.http
      .get<ApiResponse<PilotagePage>>(`${this.base}/drilldown`, { params: this.params(query) })
      .pipe(map((response) => response.data));
  }

  workload(directionId?: string | null, agentUserId?: string | null): Observable<Workload> {
    let params = new HttpParams();
    if (directionId) params = params.set('directionId', directionId);
    if (agentUserId) params = params.set('agentUserId', agentUserId);
    return this.http
      .get<ApiResponse<Workload>>(`${this.base}/workload`, { params })
      .pipe(map((response) => response.data));
  }

  private params(query: PilotageQuery): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}

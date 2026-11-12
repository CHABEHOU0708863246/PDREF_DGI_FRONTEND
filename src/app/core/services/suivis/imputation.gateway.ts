import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  ImputationAgent,
  ImputationItem,
  ImputationPage,
  ImputationQuery,
} from '../../models/suivis/imputation.model';

@Injectable({ providedIn: 'root' })
export class ImputationGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/imputations`;

  list(query: ImputationQuery = {}): Observable<ImputationPage> {
    return this.http
      .get<ApiResponse<ImputationPage>>(this.base, { params: this.params(query) })
      .pipe(map((response) => response.data));
  }

  agents(): Observable<ImputationAgent[]> {
    return this.http
      .get<ApiResponse<ImputationAgent[]>>(`${this.base}/agents`)
      .pipe(map((response) => response.data));
  }

  instructions(): Observable<string[]> {
    return this.http
      .get<ApiResponse<string[]>>(`${this.base}/instructions`)
      .pipe(map((response) => response.data));
  }

  assign(
    demandeId: string,
    userId: string,
    instruction: string | null,
  ): Observable<ImputationItem> {
    return this.http
      .post<ApiResponse<ImputationItem>>(
        `${this.base}/${encodeURIComponent(demandeId)}/attribuer`,
        { userId, instruction: instruction || null },
      )
      .pipe(map((response) => response.data));
  }

  private params(query: ImputationQuery): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}

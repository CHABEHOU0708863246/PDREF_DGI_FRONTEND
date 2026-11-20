import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  RapportExport,
  RapportExportRequest,
  RapportQuery,
  RapportResponse,
  RapportStatistiques,
} from '../../models/rapports/rapport.model';

@Injectable({ providedIn: 'root' })
export class RapportGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/rapports`;

  get(query: RapportQuery = {}): Observable<RapportResponse> {
    return this.http
      .get<ApiResponse<RapportResponse>>(this.base, { params: this.params(query) })
      .pipe(map((response) => response.data));
  }

  statistiques(query: RapportQuery = {}): Observable<RapportStatistiques> {
    return this.http
      .get<ApiResponse<RapportStatistiques>>(`${this.base}/statistiques`, {
        params: this.params(query),
      })
      .pipe(map((response) => response.data));
  }

  exports(): Observable<RapportExport[]> {
    return this.http
      .get<ApiResponse<RapportExport[]>>(`${this.base}/exports`)
      .pipe(map((response) => response.data));
  }

  createExport(request: RapportExportRequest): Observable<RapportExport> {
    return this.http
      .post<ApiResponse<RapportExport>>(`${this.base}/exports`, request)
      .pipe(map((response) => response.data));
  }

  export(id: string): Observable<RapportExport> {
    return this.http
      .get<ApiResponse<RapportExport>>(`${this.base}/exports/${id}`)
      .pipe(map((response) => response.data));
  }

  download(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/exports/${id}/fichier`, { responseType: 'blob' });
  }

  private params(query: RapportQuery): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}

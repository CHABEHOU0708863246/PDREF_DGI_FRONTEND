import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  RejetDetail,
  RejetMotif,
  RejetPage,
  RejetQuery,
} from '../../models/rejets/rejet.model';

@Injectable({ providedIn: 'root' })
export class RejetGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1`;

  list(query: RejetQuery = {}): Observable<RejetPage> {
    return this.http
      .get<ApiResponse<RejetPage>>(`${this.base}/rejets`, { params: this.params(query) })
      .pipe(map((response) => response.data));
  }

  get(id: string): Observable<RejetDetail> {
    return this.http
      .get<ApiResponse<RejetDetail>>(`${this.base}/rejets/${encodeURIComponent(id)}`)
      .pipe(map((response) => response.data));
  }

  motifs(): Observable<RejetMotif[]> {
    return this.http
      .get<ApiResponse<RejetMotif[]>>(`${this.base}/rejets/motifs`)
      .pipe(map((response) => response.data));
  }

  create(
    demandeId: string,
    body: { motifCode: string; commentaire: string; pieceComplementaireRequise?: boolean },
  ): Observable<RejetDetail> {
    return this.http
      .post<ApiResponse<RejetDetail>>(
        `${this.base}/demandes/${encodeURIComponent(demandeId)}/rejets`,
        body,
      )
      .pipe(map((response) => response.data));
  }

  reprendre(id: string): Observable<RejetDetail> {
    return this.http
      .post<ApiResponse<RejetDetail>>(`${this.base}/rejets/${encodeURIComponent(id)}/reprendre`, {})
      .pipe(map((response) => response.data));
  }

  abandonner(id: string, motif: string): Observable<RejetDetail> {
    return this.http
      .post<ApiResponse<RejetDetail>>(`${this.base}/rejets/${encodeURIComponent(id)}/abandonner`, {
        motif,
      })
      .pipe(map((response) => response.data));
  }

  private params(query: RejetQuery): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return params;
  }
}

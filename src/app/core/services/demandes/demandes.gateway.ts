import { HttpClient, HttpEventType, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  DemandeDetail,
  DemandeFormulaire,
  DemandePage,
  DemandePdf,
  DemandeQuery,
  DemandeWrite,
} from '../../models/demandes/demande.model';
import type { FileGroup } from '../../models/files/file.model';

@Injectable({ providedIn: 'root' })
export class DemandesGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/demandes`;

  formulaire(): Observable<DemandeFormulaire> {
    return this.http
      .get<ApiResponse<DemandeFormulaire>>(`${this.base}/formulaire`)
      .pipe(map((response) => response.data));
  }

  list(query: DemandeQuery): Observable<DemandePage> {
    return this.http
      .get<ApiResponse<DemandePage>>(this.base, { params: this.params(query) })
      .pipe(map((response) => response.data));
  }

  get(id: string): Observable<DemandeDetail> {
    return this.http
      .get<ApiResponse<DemandeDetail>>(`${this.base}/${encodeURIComponent(id)}`)
      .pipe(map((response) => response.data));
  }

  create(request: DemandeWrite): Observable<DemandeDetail> {
    return this.http
      .post<ApiResponse<DemandeDetail>>(this.base, request)
      .pipe(map((response) => response.data));
  }

  update(id: string, request: DemandeWrite, version: number): Observable<DemandeDetail> {
    const headers = new HttpHeaders({ 'If-Match': `"${version}"` });
    return this.http
      .put<ApiResponse<DemandeDetail>>(`${this.base}/${encodeURIComponent(id)}`, request, {
        headers,
      })
      .pipe(map((response) => response.data));
  }

  export(id: string): Observable<DemandePdf> {
    return this.http
      .get(`${this.base}/${encodeURIComponent(id)}/export`, {
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        map((response) => ({
          blob: response.body ?? new Blob(),
          fileName: this.fileName(response.headers.get('content-disposition')),
        })),
      );
  }

  exportList(query: DemandeQuery): Observable<DemandePdf> {
    return this.http
      .get(`${this.base}/export-liste`, {
        params: this.params({ ...query, page: 1, pageSize: 100 }),
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        map((response) => ({
          blob: response.body ?? new Blob(),
          fileName: this.fileName(response.headers.get('content-disposition')),
        })),
      );
  }

  attachments(id: string): Observable<FileGroup[]> {
    return this.http
      .get<ApiResponse<FileGroup[]>>(`${this.base}/${encodeURIComponent(id)}/pieces-jointes`)
      .pipe(map((response) => response.data));
  }

  uploadAttachment(id: string, file: File): Observable<number> {
    const form = new FormData();
    form.append('file', file);
    return this.http
      .post<ApiResponse<FileGroup>>(`${this.base}/${encodeURIComponent(id)}/pieces-jointes`, form, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        map((event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            return Math.round((event.loaded / event.total) * 100);
          }
          return event.type === HttpEventType.Response ? 100 : 0;
        }),
      );
  }

  downloadAttachment(
    id: string,
    versionId: string,
  ): Observable<{ blob: Blob; fileName: string | null }> {
    return this.http
      .get(
        `${this.base}/${encodeURIComponent(id)}/pieces-jointes/${encodeURIComponent(versionId)}/download`,
        { observe: 'response', responseType: 'blob' },
      )
      .pipe(
        map((response) => ({
          blob: response.body ?? new Blob(),
          fileName: this.fileName(response.headers.get('content-disposition')),
        })),
      );
  }

  private params(query: DemandeQuery): HttpParams {
    let params = new HttpParams();
    const values: Record<string, string | number | null | undefined> = {
      search: query.search,
      statut: query.statut,
      origine: query.origine,
      dateDu: query.dateDu,
      dateAu: query.dateAu,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    };
    for (const [key, value] of Object.entries(values)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  private fileName(header: string | null): string | null {
    if (!header) {
      return null;
    }
    const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
    if (star?.[1]) {
      return decodeURIComponent(star[1]);
    }
    const plain = /filename="?([^";]+)"?/i.exec(header);
    return plain?.[1] ?? null;
  }
}

import { HttpClient, HttpParams, type HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  ImportErrorPage,
  ImportErrorQuery,
  ImportJobDetail,
  ImportPage,
  ImportQuery,
} from '../../models/imports/import.model';

export interface DownloadFile {
  blob: Blob;
  fileName: string;
}

@Injectable({ providedIn: 'root' })
export class ImportGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/imports`;

  list(query: ImportQuery = {}): Observable<ImportPage> {
    return this.http
      .get<ApiResponse<ImportPage>>(this.base, { params: this.params(query) })
      .pipe(map((response) => response.data));
  }

  get(id: string): Observable<ImportJobDetail> {
    return this.http
      .get<ApiResponse<ImportJobDetail>>(`${this.base}/${encodeURIComponent(id)}`)
      .pipe(map((response) => response.data));
  }

  errors(id: string, query: ImportErrorQuery = {}): Observable<ImportErrorPage> {
    return this.http
      .get<ApiResponse<ImportErrorPage>>(`${this.base}/${encodeURIComponent(id)}/erreurs`, {
        params: this.params(query),
      })
      .pipe(map((response) => response.data));
  }

  upload(file: File): Observable<ImportJobDetail> {
    const body = new FormData();
    body.append('file', file);
    return this.http
      .post<ApiResponse<ImportJobDetail>>(this.base, body)
      .pipe(map((response) => response.data));
  }

  downloadReport(id: string, format: 'xlsx' = 'xlsx'): Observable<DownloadFile> {
    return this.http
      .get(`${this.base}/${encodeURIComponent(id)}/rapport?format=${format}`, {
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(map((response) => this.toDownload(response)));
  }

  downloadTemplate(): Observable<DownloadFile> {
    return this.http
      .get(`${this.base}/template`, { observe: 'response', responseType: 'blob' })
      .pipe(map((response) => this.toDownload(response)));
  }

  private toDownload(response: HttpResponse<Blob>): DownloadFile {
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
    const simple = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
    return {
      blob: response.body ?? new Blob(),
      fileName: decodeURIComponent(encoded ?? simple ?? 'import'),
    };
  }

  private params(query: ImportQuery | ImportErrorQuery): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return params;
  }
}

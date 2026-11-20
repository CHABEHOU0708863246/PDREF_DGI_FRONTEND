import { HttpClient, HttpEventType, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type { FileGroup } from '../../models/files/file.model';
import type {
  CourrierASigner,
  CourrierDetail,
  CourrierLookup,
  CourrierNumeroPreview,
  CourrierPage,
  CourrierQuery,
  CourrierWrite,
} from '../../models/courriers/courrier.model';

@Injectable({ providedIn: 'root' })
export class CourriersGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/courriers`;

  aSigner(search?: string): Observable<CourrierASigner[]> {
    return this.http
      .get<ApiResponse<CourrierASigner[]>>(`${this.base}-manuels/a-signer`, {
        params: search ? { search } : {},
      })
      .pipe(map((response) => response.data));
  }

  list(query: CourrierQuery): Observable<CourrierPage> {
    return this.http
      .get<ApiResponse<CourrierPage>>(this.base, { params: this.params(query) })
      .pipe(map((response) => response.data));
  }

  get(id: string): Observable<CourrierDetail> {
    return this.http
      .get<ApiResponse<CourrierDetail>>(`${this.base}/${encodeURIComponent(id)}`)
      .pipe(map((response) => response.data));
  }

  create(request: CourrierWrite): Observable<CourrierDetail> {
    return this.http
      .post<ApiResponse<CourrierDetail>>(this.base, request)
      .pipe(map((response) => response.data));
  }

  update(id: string, request: CourrierWrite): Observable<CourrierDetail> {
    return this.http
      .put<ApiResponse<CourrierDetail>>(`${this.base}/${encodeURIComponent(id)}`, request)
      .pipe(map((response) => response.data));
  }

  lookup(term: string): Observable<readonly CourrierLookup[]> {
    return this.http
      .get<ApiResponse<CourrierLookup[]>>(`${this.base}/lookup`, { params: { term } })
      .pipe(map((response) => response.data));
  }

  prochainNumero(expediteur: string | null): Observable<CourrierNumeroPreview> {
    return this.http
      .get<ApiResponse<CourrierNumeroPreview>>(`${this.base}/prochain-numero`, {
        params: expediteur ? { expediteur } : {},
      })
      .pipe(map((response) => response.data));
  }

  expediteurs(term: string): Observable<readonly string[]> {
    return this.http
      .get<ApiResponse<string[]>>(`${this.base}/expediteurs`, { params: { term } })
      .pipe(map((response) => response.data));
  }

  fichePdf(id: string): Observable<{ blob: Blob; fileName: string | null }> {
    return this.http
      .get(`${this.base}/${encodeURIComponent(id)}/fiche-pdf`, {
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
        {
          observe: 'response',
          responseType: 'blob',
        },
      )
      .pipe(
        map((response) => ({
          blob: response.body ?? new Blob(),
          fileName: this.fileName(response.headers.get('content-disposition')),
        })),
      );
  }

  private params(query: CourrierQuery): HttpParams {
    let params = new HttpParams();
    const values: Record<string, string | number | boolean | null | undefined> = {
      typeCourrier: query.typeCourrier,
      sens: query.sens,
      dateDu: query.dateDu,
      dateAu: query.dateAu,
      expediteur: query.expediteur,
      lie: query.lie,
      sansDemande: query.sansDemande,
      search: query.search,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      sort: query.sort ?? 'date',
      direction: query.direction ?? 'desc',
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

  signerManuel(
    id: string,
    file: File,
    signataire: string,
    dateSignature: string,
  ): Observable<{ statut: string; sha256: string | null }> {
    const form = new FormData();
    form.append('file', file);
    form.append('signataire', signataire);
    form.append('dateSignature', dateSignature);
    return this.http
      .post<ApiResponse<{ statut: string; sha256: string | null }>>(
        `${environment.apiUrl}/api/v1/courriers-manuels/${encodeURIComponent(id)}/signature`,
        form,
      )
      .pipe(map((response) => response.data));
  }

  declarerRemise(
    id: string,
    canal: string,
    dateRemise: string,
    reference: string,
  ): Observable<void> {
    return this.http
      .post<ApiResponse<object>>(
        `${environment.apiUrl}/api/v1/courriers-manuels/${encodeURIComponent(id)}/remise`,
        { canal, dateRemise, reference },
      )
      .pipe(map(() => undefined));
  }
}

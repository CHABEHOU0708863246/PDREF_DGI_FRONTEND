import { HttpClient, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type { FileGroup, FilePolicy } from '../../models/files/file.model';

@Injectable({ providedIn: 'root' })
export class FilesGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/files`;

  policy(ownerType?: string): Observable<FilePolicy> {
    return this.http
      .get<ApiResponse<FilePolicy>>(`${this.base}/policy`, {
        params: ownerType ? { ownerType } : {},
      })
      .pipe(map((response) => response.data));
  }

  list(): Observable<FileGroup[]> {
    return this.http
      .get<ApiResponse<FileGroup[]>>(this.base)
      .pipe(map((response) => response.data));
  }

  upload(file: File, ownerType?: string, ownerId?: string): Observable<number> {
    const form = new FormData();
    form.append('file', file);
    if (ownerType) {
      form.append('ownerType', ownerType);
    }
    if (ownerId) {
      form.append('ownerId', ownerId);
    }
    return this.http
      .post<ApiResponse<FileGroup>>(this.base, form, { reportProgress: true, observe: 'events' })
      .pipe(
        map((event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            return Math.round((event.loaded / event.total) * 100);
          }
          return event.type === HttpEventType.Response ? 100 : 0;
        }),
      );
  }

  uploadGroup(file: File, ownerType?: string, ownerId?: string, origin?: string): Observable<FileGroup> {
    const form = new FormData();
    form.append('file', file);
    if (ownerType) {
      form.append('ownerType', ownerType);
    }
    if (ownerId) {
      form.append('ownerId', ownerId);
    }
    if (origin) {
      form.append('origin', origin);
    }
    return this.http
      .post<ApiResponse<FileGroup>>(this.base, form)
      .pipe(map((response) => response.data));
  }

  replace(groupId: string, file: File): Observable<FileGroup> {
    const form = new FormData();
    form.append('file', file);
    return this.http
      .post<ApiResponse<FileGroup>>(`${this.base}/${groupId}/versions`, form)
      .pipe(map((response) => response.data));
  }

  download(versionId: string): Observable<{ blob: Blob; fileName: string | null }> {
    return this.http
      .get(`${this.base}/${versionId}/download`, {
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

  delete(versionId: string): Observable<unknown> {
    return this.http.post(`${this.base}/${versionId}/delete`, null);
  }
}

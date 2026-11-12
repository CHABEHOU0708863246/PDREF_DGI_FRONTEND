import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type { RejetPiecesDossier } from '../../models/rejets/rejet.model';

@Injectable({ providedIn: 'root' })
export class RejetPiecesGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/espace/dossiers`;

  get(dossierId: string): Observable<RejetPiecesDossier> {
    return this.http
      .get<ApiResponse<RejetPiecesDossier>>(
        `${this.base}/${encodeURIComponent(dossierId)}/pieces-demandees`,
      )
      .pipe(map((response) => response.data));
  }

  send(
    dossierId: string,
    files: readonly File[],
    message: string | null,
  ): Observable<RejetPiecesDossier> {
    const form = new FormData();
    for (const file of files) {
      form.append('files', file, file.name);
    }

    if (message?.trim()) {
      form.append('message', message.trim());
    }

    return this.http
      .post<ApiResponse<RejetPiecesDossier>>(
        `${this.base}/${encodeURIComponent(dossierId)}/pieces-demandees`,
        form,
      )
      .pipe(map((response) => response.data));
  }
}

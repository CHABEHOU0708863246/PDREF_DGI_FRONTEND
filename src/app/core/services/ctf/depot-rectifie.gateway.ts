import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  CtfMotifNonConformite,
  DepotRectifie,
  DepotRectifieControlRequest,
  DepotRectifieCreateRequest,
} from '../../models/ctf/depot-rectifie.model';
import type { FileGroup } from '../../models/files/file.model';

@Injectable({ providedIn: 'root' })
export class DepotRectifieGateway {
  private readonly http = inject(HttpClient);
  private readonly espaceRoot = `${environment.apiUrl}/api/v1/espace/dossiers`;
  private readonly ctfRoot = `${environment.apiUrl}/api/v1/ctf`;

  listEspace(demandeId: string): Observable<DepotRectifie[]> {
    return this.http
      .get<ApiResponse<DepotRectifie[]>>(`${this.espaceRoot}/${demandeId}/depots-rectifies`)
      .pipe(map((response) => response.data));
  }

  submitEspace(demandeId: string, request: DepotRectifieCreateRequest): Observable<DepotRectifie> {
    return this.http
      .post<ApiResponse<DepotRectifie>>(`${this.espaceRoot}/${demandeId}/depots-rectifies`, request)
      .pipe(map((response) => response.data));
  }

  uploadEspacePiece(demandeId: string, file: File): Observable<FileGroup> {
    const form = new FormData();
    form.append('file', file);
    return this.http
      .post<ApiResponse<FileGroup>>(`${this.espaceRoot}/${demandeId}/depots-rectifies/pieces`, form)
      .pipe(map((response) => response.data));
  }

  listCtf(demandeId: string): Observable<DepotRectifie[]> {
    return this.http
      .get<ApiResponse<DepotRectifie[]>>(`${this.ctfRoot}/${demandeId}/depots-rectifies`)
      .pipe(map((response) => response.data));
  }

  motifsNonConformite(): Observable<CtfMotifNonConformite[]> {
    return this.http
      .get<ApiResponse<CtfMotifNonConformite[]>>(`${this.ctfRoot}/motifs-non-conformite`)
      .pipe(map((response) => response.data));
  }

  control(
    demandeId: string,
    depotId: string,
    request: DepotRectifieControlRequest,
  ): Observable<DepotRectifie> {
    return this.http
      .post<ApiResponse<DepotRectifie>>(
        `${this.ctfRoot}/${demandeId}/depots-rectifies/${depotId}/controle`,
        request,
      )
      .pipe(map((response) => response.data));
  }
}

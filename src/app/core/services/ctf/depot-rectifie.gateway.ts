import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  DepotRectifie,
  DepotRectifieControlRequest,
  DepotRectifieCreateRequest,
} from '../../models/ctf/depot-rectifie.model';

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

  listCtf(demandeId: string): Observable<DepotRectifie[]> {
    return this.http
      .get<ApiResponse<DepotRectifie[]>>(`${this.ctfRoot}/${demandeId}/depots-rectifies`)
      .pipe(map((response) => response.data));
  }

  control(demandeId: string, depotId: string, request: DepotRectifieControlRequest): Observable<DepotRectifie> {
    return this.http
      .post<ApiResponse<DepotRectifie>>(
        `${this.ctfRoot}/${demandeId}/depots-rectifies/${depotId}/controle`,
        request,
      )
      .pipe(map((response) => response.data));
  }
}

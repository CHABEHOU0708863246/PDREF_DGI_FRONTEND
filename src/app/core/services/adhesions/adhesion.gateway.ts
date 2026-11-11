import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  AdhesionCompte,
  AdhesionCreateRequest,
  AdhesionDetail,
  AdhesionListItem,
  AdhesionMessage,
  AdhesionMotif,
  AdhesionPiece,
  AdhesionSuivi,
  AdhesionVerify,
  EspaceDossier,
} from '../../models/adhesions/adhesion.model';

@Injectable({ providedIn: 'root' })
export class AdhesionGateway {
  private readonly http = inject(HttpClient);
  private readonly publicRoot = `${environment.apiUrl}/api/v1/public/adhesions`;
  private readonly agentRoot = `${environment.apiUrl}/api/v1/adhesions`;
  private readonly espaceRoot = `${environment.apiUrl}/api/v1/espace`;

  activation(): Observable<void> {
    return this.http
      .get<ApiResponse<{ actif: boolean }>>(`${this.publicRoot}/activation`)
      .pipe(map(() => undefined));
  }

  create(request: AdhesionCreateRequest): Observable<AdhesionMessage> {
    return this.http
      .post<ApiResponse<AdhesionMessage>>(this.publicRoot, request)
      .pipe(map((response) => response.data));
  }

  verify(token: string): Observable<AdhesionVerify> {
    return this.http
      .post<ApiResponse<AdhesionVerify>>(`${this.publicRoot}/verifier-email`, { token })
      .pipe(map((response) => response.data));
  }

  suivi(token: string): Observable<AdhesionSuivi> {
    return this.http
      .get<ApiResponse<AdhesionSuivi>>(`${this.publicRoot}/suivi`, {
        headers: { 'X-Adhesion-Token': token },
      })
      .pipe(map((response) => response.data));
  }

  uploadPiece(token: string, type: string, file: File): Observable<AdhesionPiece> {
    const form = new FormData();
    form.append('type', type);
    form.append('file', file);
    return this.http
      .post<ApiResponse<AdhesionPiece>>(`${this.publicRoot}/pieces`, form, {
        headers: { 'X-Adhesion-Token': token },
      })
      .pipe(map((response) => response.data));
  }

  submit(token: string): Observable<AdhesionSuivi> {
    return this.http
      .post<ApiResponse<AdhesionSuivi>>(
        `${this.publicRoot}/soumettre`,
        {},
        { headers: { 'X-Adhesion-Token': token } },
      )
      .pipe(map((response) => response.data));
  }

  modeleUrl(): string {
    return `${this.publicRoot}/modele-autorisation`;
  }

  list(statut?: string, search?: string): Observable<AdhesionListItem[]> {
    return this.http
      .get<ApiResponse<AdhesionListItem[]>>(this.agentRoot, {
        params: this.params({ statut, search }),
      })
      .pipe(map((response) => response.data));
  }

  detail(id: string): Observable<AdhesionDetail> {
    return this.http
      .get<ApiResponse<AdhesionDetail>>(`${this.agentRoot}/${id}`)
      .pipe(map((response) => response.data));
  }

  motifs(): Observable<AdhesionMotif[]> {
    return this.http
      .get<ApiResponse<AdhesionMotif[]>>(`${this.agentRoot}/motifs`)
      .pipe(map((response) => response.data));
  }

  accept(id: string): Observable<void> {
    return this.http
      .post<ApiResponse<object>>(`${this.agentRoot}/${id}/accepter`, {})
      .pipe(map(() => undefined));
  }

  refuse(id: string, motifCode: string): Observable<void> {
    return this.http
      .post<ApiResponse<object>>(`${this.agentRoot}/${id}/refuser`, { motifCode })
      .pipe(map(() => undefined));
  }

  accounts(search?: string): Observable<AdhesionCompte[]> {
    return this.http
      .get<ApiResponse<AdhesionCompte[]>>(`${this.agentRoot}/comptes`, {
        params: this.params({ search }),
      })
      .pipe(map((response) => response.data));
  }

  deactivate(userId: string, motif: string): Observable<void> {
    return this.http
      .post<ApiResponse<object>>(`${this.agentRoot}/comptes/${userId}/desactiver`, { motif })
      .pipe(map(() => undefined));
  }

  reactivate(userId: string, motif: string): Observable<void> {
    return this.http
      .post<ApiResponse<object>>(`${this.agentRoot}/comptes/${userId}/reactiver`, { motif })
      .pipe(map(() => undefined));
  }

  downloadPiece(id: string, versionId: string): Observable<Blob> {
    return this.http.get(`${this.agentRoot}/${id}/pieces/${versionId}/download`, {
      responseType: 'blob',
    });
  }

  dossiers(): Observable<EspaceDossier[]> {
    return this.http
      .get<ApiResponse<EspaceDossier[]>>(`${this.espaceRoot}/dossiers`)
      .pipe(map((response) => response.data));
  }

  dossier(id: string): Observable<EspaceDossier> {
    return this.http
      .get<ApiResponse<EspaceDossier>>(`${this.espaceRoot}/dossiers/${id}`)
      .pipe(map((response) => response.data));
  }

  downloadCourrier(id: string): Observable<Blob> {
    return this.http.get(`${this.espaceRoot}/dossiers/${id}/courrier`, {
      responseType: 'blob',
    });
  }

  private params(values: Record<string, string | undefined>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) {
      if (value) {
        params = params.set(key, value);
      }
    }
    return params;
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type { DemandeDetail, DemandeFormulaire } from '../../models/demandes/demande.model';
import type {
  DepotDepositResult,
  DepotDraft,
  DepotDraftRequest,
  DepotDraftSummary,
} from '../../models/depots/depot.model';
import type { FileGroup } from '../../models/files/file.model';

@Injectable({ providedIn: 'root' })
export class DepotGateway {
  private readonly http = inject(HttpClient);
  private readonly root = `${environment.apiUrl}/api/v1/espace/depots`;

  activation(): Observable<void> {
    return this.http
      .get<ApiResponse<{ actif: boolean }>>(`${this.root}/activation`)
      .pipe(map(() => undefined));
  }

  formulaire(): Observable<DemandeFormulaire> {
    return this.http
      .get<ApiResponse<DemandeFormulaire>>(`${this.root}/formulaire`)
      .pipe(map((response) => response.data));
  }

  drafts(): Observable<DepotDraftSummary[]> {
    return this.http
      .get<ApiResponse<DepotDraftSummary[]>>(`${this.root}/brouillons`)
      .pipe(map((response) => response.data));
  }

  draft(id: string): Observable<DepotDraft> {
    return this.http
      .get<ApiResponse<DepotDraft>>(`${this.root}/brouillons/${id}`)
      .pipe(map((response) => response.data));
  }

  create(request: DepotDraftRequest): Observable<DepotDraft> {
    return this.http
      .post<ApiResponse<DepotDraft>>(`${this.root}/brouillons`, request)
      .pipe(map((response) => response.data));
  }

  save(id: string, request: DepotDraftRequest): Observable<DepotDraft> {
    return this.http
      .put<ApiResponse<DepotDraft>>(`${this.root}/brouillons/${id}`, request)
      .pipe(map((response) => response.data));
  }

  validateStep(id: string, etape: number, request: DepotDraftRequest): Observable<DepotDraft> {
    return this.http
      .post<ApiResponse<DepotDraft>>(
        `${this.root}/brouillons/${id}/etapes/${etape}/valider`,
        request,
      )
      .pipe(map((response) => response.data));
  }

  pieces(id: string): Observable<FileGroup[]> {
    return this.http
      .get<ApiResponse<FileGroup[]>>(`${this.root}/brouillons/${id}/pieces`)
      .pipe(map((response) => response.data));
  }

  uploadPiece(id: string, file: File): Observable<FileGroup> {
    const form = new FormData();
    form.append('file', file);
    return this.http
      .post<ApiResponse<FileGroup>>(`${this.root}/brouillons/${id}/pieces`, form)
      .pipe(map((response) => response.data));
  }

  deposit(id: string, idempotencyKey: string): Observable<DepotDepositResult> {
    return this.http
      .post<ApiResponse<DepotDepositResult>>(`${this.root}/brouillons/${id}/deposer`, {
        idempotencyKey,
      })
      .pipe(map((response) => response.data));
  }

  accuse(id: string): Observable<Blob> {
    return this.http.get(`${this.root}/${id}/accuse`, { responseType: 'blob' });
  }

  detail(id: string): Observable<DemandeDetail> {
    return this.http
      .get<ApiResponse<DemandeDetail>>(`${this.root}/brouillons/${id}`)
      .pipe(map((response) => response.data as unknown as DemandeDetail));
  }
}

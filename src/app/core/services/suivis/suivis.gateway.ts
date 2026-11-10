import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  AvisDecisionWrite,
  CorrectionDecision,
  CorrectionDecisionWrite,
  DepotResult,
  MotifNonFavorable,
  SignatureResult,
  SuiviDetail,
  SuiviExport,
  SuiviPage,
  SuiviQuery,
  TransmissionResult,
  TransmissionSuiviWrite,
  ValidationGlobaleWrite,
} from '../../models/suivis/suivi.model';

@Injectable({ providedIn: 'root' })
export class SuivisGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1`;
  private readonly suivis = `${this.base}/suivis`;
  private readonly demandes = `${this.base}/demandes`;

  list(query: SuiviQuery): Observable<SuiviPage> {
    return this.http
      .get<ApiResponse<SuiviPage>>(this.suivis, { params: this.params(query) })
      .pipe(map((response) => response.data));
  }

  get(demandeId: string): Observable<SuiviDetail> {
    return this.http
      .get<ApiResponse<SuiviDetail>>(`${this.suivis}/${encodeURIComponent(demandeId)}`)
      .pipe(map((response) => response.data));
  }

  motifs(): Observable<MotifNonFavorable[]> {
    return this.http
      .get<ApiResponse<MotifNonFavorable[]>>(`${this.suivis}/motifs`)
      .pipe(map((response) => response.data));
  }

  verifierGudef(demandeId: string): Observable<SuiviDetail> {
    return this.http
      .post<ApiResponse<SuiviDetail>>(
        `${this.demandes}/${encodeURIComponent(demandeId)}/verification-gudef`,
        null,
      )
      .pipe(map((response) => response.data));
  }

  decideAvis(
    demandeId: string,
    etapeCode: string,
    body: AvisDecisionWrite,
  ): Observable<SuiviDetail> {
    return this.http
      .post<ApiResponse<SuiviDetail>>(
        `${this.demandes}/${encodeURIComponent(demandeId)}/avis/${encodeURIComponent(etapeCode)}/decision`,
        body,
      )
      .pipe(map((response) => response.data));
  }

  decideValidation(demandeId: string, body: ValidationGlobaleWrite): Observable<SuiviDetail> {
    return this.http
      .post<ApiResponse<SuiviDetail>>(
        `${this.demandes}/${encodeURIComponent(demandeId)}/validation`,
        body,
      )
      .pipe(map((response) => response.data));
  }

  correct(demandeId: string, body: CorrectionDecisionWrite): Observable<CorrectionDecision> {
    return this.http
      .post<ApiResponse<CorrectionDecision>>(
        `${this.demandes}/${encodeURIComponent(demandeId)}/corrections`,
        body,
      )
      .pipe(map((response) => response.data));
  }

  transmit(demandeId: string, body: TransmissionSuiviWrite): Observable<TransmissionResult> {
    return this.http
      .post<ApiResponse<TransmissionResult>>(
        `${this.demandes}/${encodeURIComponent(demandeId)}/transmissions`,
        body,
      )
      .pipe(map((response) => response.data));
  }

  signature(demandeId: string): Observable<SignatureResult> {
    return this.http
      .post<ApiResponse<SignatureResult>>(
        `${this.demandes}/${encodeURIComponent(demandeId)}/courrier-reponse/signature`,
        null,
      )
      .pipe(map((response) => response.data));
  }

  depot(demandeId: string): Observable<DepotResult> {
    return this.http
      .post<ApiResponse<DepotResult>>(
        `${this.demandes}/${encodeURIComponent(demandeId)}/courrier-reponse/depot`,
        null,
      )
      .pipe(map((response) => response.data));
  }

  exportBase(query: SuiviQuery): Observable<SuiviExport> {
    return this.http
      .get(`${this.suivis}/base-demandes`, {
        params: this.params(query),
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

  private params(query: SuiviQuery): HttpParams {
    let params = new HttpParams();
    const values: Record<string, string | number | null | undefined> = {
      search: query.search,
      statut: query.statut,
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

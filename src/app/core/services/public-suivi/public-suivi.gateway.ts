import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  PublicSuiviRequest,
  PublicSuiviResponse,
} from '../../models/public-suivi/public-suivi.model';

const NEUTRAL_MESSAGE = 'Aucun dossier trouvé avec ces informations.';

@Injectable({ providedIn: 'root' })
export class PublicSuiviGateway {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/api/v1/public/suivi`;

  search(request: PublicSuiviRequest): Observable<PublicSuiviResponse> {
    return this.http.post<ApiResponse<PublicSuiviResponse>>(this.url, request).pipe(
      map((response) => response.data),
      catchError((error: { status?: number }) => {
        if (error.status === 404) {
          return of({ trouve: false, message: NEUTRAL_MESSAGE, dossiers: [] });
        }
        return throwError(() => error);
      }),
    );
  }
}

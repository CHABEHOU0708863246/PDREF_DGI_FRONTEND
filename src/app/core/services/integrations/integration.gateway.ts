import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type { IntegrationModes } from '../../models/integrations/integration.model';

@Injectable({ providedIn: 'root' })
export class IntegrationGateway {
  private readonly http = inject(HttpClient);

  modes(): Observable<IntegrationModes> {
    return this.http
      .get<ApiResponse<IntegrationModes>>(`${environment.apiUrl}/api/v1/integrations/modes`)
      .pipe(map((response) => response.data));
  }
}

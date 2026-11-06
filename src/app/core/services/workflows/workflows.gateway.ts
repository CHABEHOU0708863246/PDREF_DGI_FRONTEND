import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type { WorkflowDefinition } from '../../models/workflows/workflow.model';

@Injectable({ providedIn: 'root' })
export class WorkflowsGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/workflows`;

  list(status?: string): Observable<WorkflowDefinition[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http
      .get<ApiResponse<WorkflowDefinition[]>>(this.base, { params })
      .pipe(map((response) => response.data));
  }

  get(code: string, versionDef: number): Observable<WorkflowDefinition> {
    return this.http
      .get<ApiResponse<WorkflowDefinition>>(
        `${this.base}/${encodeURIComponent(code)}/versions/${versionDef}`,
      )
      .pipe(map((response) => response.data));
  }
}

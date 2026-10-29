import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  Direction,
  FiscalYear,
  NotificationTemplate,
  PagedResult,
  ParameterDefinition,
  ParameterVersion,
  ReferenceQuery,
  ValueListItem,
} from '../../models/admin/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/admin`;

  directions(query: ReferenceQuery): Observable<PagedResult<Direction>> {
    return this.get<PagedResult<Direction>>('directions', query);
  }

  createDirection(body: unknown): Observable<Direction> {
    return this.post<Direction>('directions', body);
  }

  updateDirection(id: string, body: unknown): Observable<Direction> {
    return this.put<Direction>(`directions/${id}`, body);
  }

  setDirectionActive(id: string, active: boolean, reason: string): Observable<unknown> {
    return this.post(`directions/${id}/${active ? 'activate' : 'deactivate'}`, {
      isActive: active,
      reason,
    });
  }

  fiscalYears(query: ReferenceQuery): Observable<PagedResult<FiscalYear>> {
    return this.get<PagedResult<FiscalYear>>('exercices', query);
  }

  createFiscalYear(body: unknown): Observable<FiscalYear> {
    return this.post<FiscalYear>('exercices', body);
  }

  updateFiscalYear(id: string, body: unknown): Observable<FiscalYear> {
    return this.put<FiscalYear>(`exercices/${id}`, body);
  }

  setFiscalYearActive(id: string, active: boolean, reason: string): Observable<FiscalYear> {
    return this.post<FiscalYear>(`exercices/${id}/${active ? 'activate' : 'deactivate'}`, {
      isActive: active,
      reason,
    });
  }

  values(query: ReferenceQuery): Observable<PagedResult<ValueListItem>> {
    return this.get<PagedResult<ValueListItem>>('listes-valeurs', query);
  }

  createValue(body: unknown): Observable<ValueListItem> {
    return this.post<ValueListItem>('listes-valeurs', body);
  }

  updateValue(id: string, body: unknown): Observable<ValueListItem> {
    return this.put<ValueListItem>(`listes-valeurs/${id}`, body);
  }

  setValueActive(id: string, active: boolean, reason: string): Observable<ValueListItem> {
    return this.post<ValueListItem>(`listes-valeurs/${id}/${active ? 'activate' : 'deactivate'}`, {
      isActive: active,
      reason,
    });
  }

  parameters(query: ReferenceQuery): Observable<PagedResult<ParameterDefinition>> {
    return this.get<PagedResult<ParameterDefinition>>('parametres', query);
  }

  parameterHistory(key: string): Observable<ParameterVersion[]> {
    return this.get<ParameterVersion[]>(`parametres/${encodeURIComponent(key)}/history`, {});
  }

  createParameterVersion(key: string, body: unknown): Observable<ParameterVersion> {
    return this.post<ParameterVersion>(`parametres/${encodeURIComponent(key)}/versions`, body);
  }

  templates(query: ReferenceQuery): Observable<PagedResult<NotificationTemplate>> {
    return this.get<PagedResult<NotificationTemplate>>('modeles-notifications', query);
  }

  createTemplate(body: unknown): Observable<NotificationTemplate> {
    return this.post<NotificationTemplate>('modeles-notifications', body);
  }

  updateTemplate(id: string, body: unknown): Observable<NotificationTemplate> {
    return this.put<NotificationTemplate>(`modeles-notifications/${id}`, body);
  }

  private get<T>(path: string, query: ReferenceQuery): Observable<T> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http
      .get<ApiResponse<T>>(`${this.base}/${path}`, { params })
      .pipe(map((response) => response.data));
  }

  private post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.base}/${path}`, body)
      .pipe(map((response) => response.data));
  }

  private put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(`${this.base}/${path}`, body)
      .pipe(map((response) => response.data));
  }
}

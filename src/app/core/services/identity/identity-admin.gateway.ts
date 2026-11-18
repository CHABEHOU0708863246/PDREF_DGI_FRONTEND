import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type {
  AdminRole,
  AdminUser,
  AdminUserPage,
  CreateUserPayload,
  UpdateUserPayload,
  UserDeactivationResult,
  UserQuery,
} from '../../models/identity/identity-admin.model';

@Injectable({ providedIn: 'root' })
export class IdentityAdminGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/admin/identity`;

  users(query: UserQuery): Observable<AdminUserPage> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http
      .get<ApiResponse<AdminUserPage>>(`${this.base}/users`, { params })
      .pipe(map((response) => response.data));
  }

  roles(): Observable<AdminRole[]> {
    return this.http
      .get<ApiResponse<AdminRole[]>>(`${this.base}/roles`)
      .pipe(map((response) => response.data));
  }

  create(body: CreateUserPayload): Observable<AdminUser> {
    return this.http
      .post<ApiResponse<AdminUser>>(`${this.base}/users`, body)
      .pipe(map((response) => response.data));
  }

  update(id: string, body: UpdateUserPayload): Observable<AdminUser> {
    return this.http
      .put<ApiResponse<AdminUser>>(`${this.base}/users/${id}`, body)
      .pipe(map((response) => response.data));
  }

  updateDirection(id: string, directionId: string, directionCode: string): Observable<AdminUser> {
    return this.http
      .put<ApiResponse<AdminUser>>(`${this.base}/users/${id}/direction`, {
        directionId,
        directionCode,
      })
      .pipe(map((response) => response.data));
  }

  updateRoles(id: string, roles: string[]): Observable<unknown> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/users/${id}/roles`, { roles });
  }

  deactivate(id: string): Observable<UserDeactivationResult> {
    return this.http
      .post<ApiResponse<UserDeactivationResult>>(`${this.base}/users/${id}/deactivate`, {})
      .pipe(map((response) => response.data));
  }

  activate(id: string): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/users/${id}/enable`, {});
  }

  resendInvitation(id: string): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/users/${id}/invitation`, {});
  }

  resetMfa(id: string, reason: string): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/users/${id}/mfa/reset`, { reason });
  }

  unlock(id: string, reason: string): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/users/${id}/unlock`, { reason });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type { NotificationPage } from '../../models/notifications/notification.model';

export interface NotificationQuery {
  read?: boolean | null;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationsGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/notifications`;

  list(query: NotificationQuery = {}): Observable<NotificationPage> {
    const params: Record<string, string> = {
      page: String(query.page ?? 1),
      pageSize: String(query.pageSize ?? 20),
    };
    if (query.read !== undefined && query.read !== null) {
      params['read'] = String(query.read);
    }
    return this.http
      .get<ApiResponse<NotificationPage>>(this.base, { params })
      .pipe(map((response) => response.data));
  }

  unreadCount(): Observable<number> {
    return this.http
      .get<ApiResponse<{ count: number }>>(`${this.base}/unread-count`)
      .pipe(map((response) => response.data.count));
  }

  markRead(id: string): Observable<unknown> {
    return this.http.post(`${this.base}/${encodeURIComponent(id)}/read`, null);
  }

  markAllRead(): Observable<{ count: number }> {
    return this.http
      .post<ApiResponse<{ count: number }>>(`${this.base}/read-all`, null)
      .pipe(map((response) => response.data));
  }
}

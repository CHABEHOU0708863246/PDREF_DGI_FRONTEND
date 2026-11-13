import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../models/common/api-response.model';
import type { EmailOutboxPage, EmailTestResult } from '../../models/admin/email-admin.model';

@Injectable({ providedIn: 'root' })
export class EmailAdminGateway {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/admin/emails`;

  list(status: string | null, page: number, pageSize: number): Observable<EmailOutboxPage> {
    const params: Record<string, string> = {
      page: String(page),
      pageSize: String(pageSize),
    };
    if (status) {
      params['status'] = status;
    }
    return this.http
      .get<ApiResponse<EmailOutboxPage>>(this.base, { params })
      .pipe(map((response) => response.data));
  }

  retry(id: string): Observable<void> {
    return this.http
      .post<ApiResponse<object>>(`${this.base}/${encodeURIComponent(id)}/retry`, {})
      .pipe(map(() => void 0));
  }

  sendTest(to: string): Observable<EmailTestResult> {
    return this.http
      .post<ApiResponse<EmailTestResult>>(`${this.base}/test`, { to })
      .pipe(map((response) => response.data));
  }
}

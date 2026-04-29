import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ReportSummary } from './reports.model';

const API = `${environment.apiUrl}/restaurants`;

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);

  getSummary(restaurantId: string, from: string, to: string) {
    return this.http.get<ReportSummary>(`${API}/${restaurantId}/reports/summary`, {
      params: { from, to },
    });
  }
}

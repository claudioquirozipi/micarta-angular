import {
  ChangeDetectionStrategy, Component, OnInit,
  inject, signal,
} from '@angular/core';
import { RestaurantService } from '../../../restaurant/services/restaurant.service';
import { ReportsService } from '../../../reports/reports.service';
import { ReportSummary } from '../../../reports/reports.model';

@Component({
  selector: 'app-dashboard-reports',
  imports: [],
  templateUrl: './dashboard-reports.html',
  styleUrl: './dashboard-reports.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardReports implements OnInit {
  private restaurantSvc = inject(RestaurantService);
  private reportsSvc    = inject(ReportsService);

  readonly restaurant = this.restaurantSvc.restaurant;
  readonly loading    = signal(false);
  readonly summary    = signal<ReportSummary | null>(null);
  readonly from       = signal(this.firstDayOfMonth());
  readonly to         = signal(this.todayEnd());

  ngOnInit() {
    if (this.restaurantSvc.loaded()) {
      this.load();
    } else {
      this.restaurantSvc.loadMine().subscribe(() => this.load());
    }
  }

  setFrom(e: Event) { this.from.set((e.target as HTMLInputElement).value); }
  setTo(e: Event)   { this.to.set((e.target as HTMLInputElement).value); }

  load() {
    const r = this.restaurant();
    if (!r) return;
    this.loading.set(true);
    const from = new Date(this.from()).toISOString();
    const to   = new Date(this.to()).toISOString();
    this.reportsSvc.getSummary(r.id, from, to).subscribe({
      next:  s  => { this.summary.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private todayEnd() {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    return this.toLocalDatetimeInput(d);
  }

  private firstDayOfMonth() {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return this.toLocalDatetimeInput(d);
  }

  private toLocalDatetimeInput(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

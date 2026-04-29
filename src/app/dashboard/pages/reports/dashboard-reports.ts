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
  readonly to         = signal(this.today());

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
    this.reportsSvc.getSummary(r.id, `${this.from()}T00:00:00.000Z`, `${this.to()}T23:59:59.999Z`).subscribe({
      next:  s  => { this.summary.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }

  private firstDayOfMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }
}

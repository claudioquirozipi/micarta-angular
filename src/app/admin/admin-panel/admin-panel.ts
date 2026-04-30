import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { AdminService, RestaurantSubscription } from '../admin.service';

@Component({
  selector: 'app-admin-panel',
  imports: [DatePipe],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPanel implements OnInit {
  private adminSvc = inject(AdminService);
  private authSvc  = inject(AuthService);
  private router   = inject(Router);

  readonly today        = new Date().toISOString().substring(0, 10);
  readonly loading      = signal(true);
  readonly restaurants  = signal<RestaurantSubscription[]>([]);
  readonly activatingId = signal<string | null>(null);
  readonly activatingDate = signal('');
  readonly saving       = signal(false);

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.adminSvc.listSubscriptions().subscribe({
      next:  list => { this.restaurants.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  openActivate(restaurantId: string) {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    this.activatingDate.set(d.toISOString().substring(0, 10));
    this.activatingId.set(restaurantId);
  }

  cancelActivate() { this.activatingId.set(null); }

  confirmActivate(restaurantId: string) {
    const dateStr = this.activatingDate();
    if (!dateStr || this.saving()) return;
    this.saving.set(true);
    this.adminSvc.activateSubscription(restaurantId, new Date(dateStr).toISOString()).subscribe({
      next: () => {
        this.saving.set(false);
        this.activatingId.set(null);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  statusLabel(r: RestaurantSubscription): string {
    if (r.subscribed && r.isInGrace) return 'Gracia';
    if (r.subscribed)                return 'Activa';
    if (r.currentPeriodEnd)          return 'Vencida';
    return 'Sin suscripción';
  }

  statusClass(r: RestaurantSubscription): string {
    if (r.subscribed && r.isInGrace) return 'badge--grace';
    if (r.subscribed)                return 'badge--active';
    if (r.currentPeriodEnd)          return 'badge--expired';
    return 'badge--none';
  }

  logout() { this.authSvc.logout(); }
}

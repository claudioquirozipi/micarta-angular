import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit,
  computed, inject, signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';
import { OrderService } from '../../../orders/order.service';
import { MemberAccess, Order } from '../../../orders/order.model';

@Component({
  selector: 'app-kitchen-board',
  imports: [DatePipe],
  templateUrl: './kitchen-board.html',
  styleUrl: './kitchen-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenBoard implements OnInit, OnDestroy {
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private authSvc  = inject(AuthService);
  private orderSvc = inject(OrderService);

  readonly loading = signal(true);
  readonly error   = signal('');
  readonly access  = signal<MemberAccess | null>(null);
  readonly orders  = signal<Order[]>([]);

  readonly pending  = computed(() => this.orders().filter(o => o.status === 'PENDING'));
  readonly cooking  = computed(() => this.orders().filter(o => o.status === 'COOKING'));

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private prevPendingIds = new Set<string>();

  ngOnInit() {
    if (!this.authSvc.user()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.orderSvc.memberAccess(slug).subscribe({
      next: access => {
        if (access.role === 'WAITER') {
          this.error.set('No tienes permisos para acceder al panel de cocina.');
          this.loading.set(false);
          return;
        }
        this.access.set(access);
        this.fetchOrders(access.id);
        this.pollTimer = setInterval(() => this.fetchOrders(access.id), 10_000);
      },
      error: () => { this.error.set('No tienes acceso a este restaurante.'); this.loading.set(false); },
    });
  }

  ngOnDestroy() { if (this.pollTimer) clearInterval(this.pollTimer); }

  private fetchOrders(restaurantId: string) {
    this.orderSvc.list(restaurantId, { status: 'PENDING' }).subscribe(pending => {
      this.orderSvc.list(restaurantId, { status: 'COOKING' }).subscribe(cooking => {
        const all = [...pending, ...cooking].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

        // Sound on new PENDING orders
        const newIds = new Set(pending.map(o => o.id));
        const hasNew = pending.some(o => !this.prevPendingIds.has(o.id));
        if (hasNew && this.prevPendingIds.size > 0) this.playSound();
        this.prevPendingIds = newIds;

        this.orders.set(all);
        this.loading.set(false);
      });
    });
  }

  private playSound() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* ignore */ }
  }

  startCooking(order: Order) {
    const access = this.access();
    if (!access) return;
    this.orderSvc.updateStatus(access.id, order.id, 'COOKING').subscribe(updated => {
      this.orders.update(os => os.map(o => o.id === updated.id ? updated : o));
    });
  }

  markReady(order: Order) {
    const access = this.access();
    if (!access) return;
    this.orderSvc.updateStatus(access.id, order.id, 'READY').subscribe(updated => {
      this.orders.update(os => os.filter(o => o.id !== updated.id));
    });
  }
}

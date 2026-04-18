import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit,
  computed, inject, signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RestaurantService } from '../../../restaurant/services/restaurant.service';
import { OrderService } from '../../../orders/order.service';
import { Order, OrderStatus, STATUS_COLOR, STATUS_LABEL } from '../../../orders/order.model';

type Tab = 'active' | 'paid' | 'cancelled' | 'all';

const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'COOKING', 'READY', 'SERVED'];

@Component({
  selector: 'app-dashboard-orders',
  imports: [DatePipe],
  templateUrl: './dashboard-orders.html',
  styleUrl: './dashboard-orders.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardOrders implements OnInit, OnDestroy {
  private restaurantSvc = inject(RestaurantService);
  private orderSvc      = inject(OrderService);

  readonly restaurant = this.restaurantSvc.restaurant;
  readonly loading    = signal(true);
  readonly orders     = signal<Order[]>([]);
  readonly activeTab  = signal<Tab>('active');
  readonly expanded   = signal<string | null>(null);

  readonly STATUS_LABEL = STATUS_LABEL;
  readonly STATUS_COLOR = STATUS_COLOR;

  readonly filtered = computed(() => {
    const tab = this.activeTab();
    const all  = this.orders();
    if (tab === 'active')    return all.filter(o => ACTIVE_STATUSES.includes(o.status));
    if (tab === 'paid')      return all.filter(o => o.isPaid && o.status === 'FINISHED');
    if (tab === 'cancelled') return all.filter(o => o.status === 'CANCELLED');
    return all;
  });

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    if (this.restaurantSvc.loaded()) {
      this.load();
    } else {
      this.restaurantSvc.loadMine().subscribe(() => this.load());
    }
  }

  ngOnDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  private load() {
    const r = this.restaurant();
    if (!r) { this.loading.set(false); return; }
    this.fetchOrders(r.id);
    this.pollTimer = setInterval(() => this.fetchOrders(r.id), 15_000);
  }

  private fetchOrders(restaurantId: string) {
    this.orderSvc.list(restaurantId).subscribe({
      next: orders => { this.orders.set(orders); this.loading.set(false); },
      error: ()     => this.loading.set(false),
    });
  }

  setTab(tab: Tab) { this.activeTab.set(tab); }
  toggle(id: string) { this.expanded.set(this.expanded() === id ? null : id); }

  updateStatus(order: Order, status: OrderStatus) {
    const r = this.restaurant();
    if (!r) return;
    this.orderSvc.updateStatus(r.id, order.id, status).subscribe(updated => {
      this.orders.update(os => os.map(o => o.id === updated.id ? updated : o));
    });
  }

  togglePayment(order: Order) {
    const r = this.restaurant();
    if (!r) return;
    this.orderSvc.updatePayment(r.id, order.id, !order.isPaid).subscribe(updated => {
      this.orders.update(os => os.map(o => o.id === updated.id ? updated : o));
    });
  }

  nextStatuses(order: Order): OrderStatus[] {
    const map: Partial<Record<OrderStatus, OrderStatus[]>> = {
      PENDING:  ['COOKING', 'SERVED', 'CANCELLED'],
      COOKING:  ['READY', 'CANCELLED'],
      READY:    ['SERVED', 'CANCELLED'],
      SERVED:   ['FINISHED', 'CANCELLED'],
      FINISHED: ['CANCELLED'],
    };
    return map[order.status] ?? [];
  }
}

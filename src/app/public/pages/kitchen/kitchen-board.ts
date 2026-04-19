import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit,
  computed, inject, signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { OrderService } from '../../../orders/order.service';
import { OrderSseService } from '../../../orders/order-sse.service';
import { MenuService } from '../../../menu/menu.service';
import { MemberAccess, Order } from '../../../orders/order.model';

interface StaffDish { id: string; name: string; price: number; isAvailable: boolean; }
interface StaffCategory { id: string; name: string; dishes: StaffDish[]; }

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
  private sseSvc   = inject(OrderSseService);
  private menuSvc  = inject(MenuService);

  readonly loading  = signal(true);
  readonly error    = signal('');
  readonly access   = signal<MemberAccess | null>(null);
  readonly orders   = signal<Order[]>([]);
  readonly activeTab = signal<'orders' | 'availability'>('orders');

  readonly staffCategories = signal<StaffCategory[]>([]);
  readonly togglingDish    = signal<string | null>(null);

  readonly pending = computed(() => this.orders().filter(o => o.status === 'PENDING'));
  readonly cooking = computed(() => this.orders().filter(o => o.status === 'COOKING'));

  private sseSub: Subscription | null = null;
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
        this.loadStaffMenu(access.id);
        this.sseSub = this.sseSvc.connect(access.id).subscribe({
          next: ({ event, data }) => {
            if (event === 'order.created' && (data.status === 'PENDING' || data.status === 'COOKING')) {
              this.orders.update(os => [...os, data].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              ));
              if (data.status === 'PENDING') this.playSound();
            } else if (event === 'order.updated') {
              if (data.status === 'PENDING' || data.status === 'COOKING') {
                this.orders.update(os => {
                  const exists = os.some(o => o.id === data.id);
                  return exists
                    ? os.map(o => o.id === data.id ? data : o)
                    : [...os, data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                });
              } else {
                this.orders.update(os => os.filter(o => o.id !== data.id));
              }
            }
          },
        });
      },
      error: () => { this.error.set('No tienes acceso a este restaurante.'); this.loading.set(false); },
    });
  }

  ngOnDestroy() { this.sseSub?.unsubscribe(); }

  private fetchOrders(restaurantId: string) {
    this.orderSvc.list(restaurantId, { status: 'PENDING' }).subscribe(pending => {
      this.orderSvc.list(restaurantId, { status: 'COOKING' }).subscribe(cooking => {
        const all = [...pending, ...cooking].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        this.prevPendingIds = new Set(pending.map(o => o.id));
        this.orders.set(all);
        this.loading.set(false);
      });
    });
  }

  private loadStaffMenu(restaurantId: string) {
    this.menuSvc.getStaffCategories(restaurantId).subscribe(cats => {
      this.staffCategories.set(cats as StaffCategory[]);
    });
  }

  setTab(tab: 'orders' | 'availability') { this.activeTab.set(tab); }

  toggleDishAvailability(dish: StaffDish) {
    const access = this.access();
    if (!access || this.togglingDish()) return;
    this.togglingDish.set(dish.id);
    this.menuSvc.toggleAvailability(access.id, dish.id, !dish.isAvailable).subscribe({
      next: updated => {
        this.staffCategories.update(cats =>
          cats.map(c => ({
            ...c,
            dishes: c.dishes.map(d => d.id === updated.id ? { ...d, isAvailable: updated.isAvailable } : d),
          })),
        );
        this.togglingDish.set(null);
      },
      error: () => this.togglingDish.set(null),
    });
  }

  private playSound() {
    try {
      const ctx  = new AudioContext();
      const osc  = ctx.createOscillator();
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

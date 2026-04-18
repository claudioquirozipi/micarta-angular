import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit,
  computed, inject, signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { OrderService } from '../../../orders/order.service';
import { OrderSseService } from '../../../orders/order-sse.service';
import { PublicMenuService } from '../../../menu/public-menu.service';
import {
  MemberAccess, Order, OrderStatus,
  STATUS_COLOR, STATUS_LABEL,
} from '../../../orders/order.model';
import { PublicCategory } from '../../../menu/menu.model';

interface CartItem { dishId: string; dishName: string; dishPrice: number; quantity: number; }

@Component({
  selector: 'app-waiter-board',
  imports: [FormsModule],
  templateUrl: './waiter-board.html',
  styleUrl: './waiter-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaiterBoard implements OnInit, OnDestroy {
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private authSvc  = inject(AuthService);
  private orderSvc = inject(OrderService);
  private sseSvc   = inject(OrderSseService);
  private menuSvc  = inject(PublicMenuService);

  readonly loading    = signal(true);
  readonly error      = signal('');
  readonly access     = signal<MemberAccess | null>(null);
  readonly orders     = signal<Order[]>([]);
  readonly activeTab  = signal<'orders' | 'new'>('orders');
  readonly expanded   = signal<string | null>(null);

  readonly categories = signal<PublicCategory[]>([]);
  readonly activeCatId = signal<string | null>(null);
  readonly cart       = signal<CartItem[]>([]);
  readonly tableNumber = signal('');
  readonly notes       = signal('');
  readonly directDelivery = signal(false);
  readonly saving     = signal(false);

  readonly STATUS_LABEL = STATUS_LABEL;
  readonly STATUS_COLOR = STATUS_COLOR;

  readonly activeOrders = computed(() =>
    this.orders().filter(o => !['FINISHED', 'CANCELLED'].includes(o.status)),
  );

  readonly activeDishes = computed(() =>
    this.categories().find(c => c.id === this.activeCatId())?.dishes ?? [],
  );

  readonly cartTotal = computed(() =>
    this.cart().reduce((s, i) => s + i.dishPrice * i.quantity, 0),
  );

  private sseSub: Subscription | null = null;

  ngOnInit() {
    if (!this.authSvc.user()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.orderSvc.memberAccess(slug).subscribe({
      next: access => {
        if (access.role === 'CHEF') {
          this.error.set('No tienes permisos para acceder al panel de mesero.');
          this.loading.set(false);
          return;
        }
        this.access.set(access);
        this.fetchOrders(access.id);
        this.loadMenu(slug);
        this.sseSub = this.sseSvc.connect(access.id).subscribe({
          next: ({ event, data }) => {
            if (event === 'order.created') {
              this.orders.update(os => [data, ...os]);
            } else {
              this.orders.update(os => os.map(o => o.id === data.id ? data : o));
            }
          },
        });
      },
      error: () => { this.error.set('No tienes acceso a este restaurante.'); this.loading.set(false); },
    });
  }

  ngOnDestroy() { this.sseSub?.unsubscribe(); }

  private fetchOrders(restaurantId: string) {
    this.orderSvc.list(restaurantId).subscribe(orders => {
      this.orders.set(orders);
      this.loading.set(false);
    });
  }

  private loadMenu(slug: string) {
    this.menuSvc.getMenu(slug).subscribe(menu => {
      this.categories.set(menu.categories);
      if (menu.categories.length) this.activeCatId.set(menu.categories[0].id);
    });
  }

  setTab(tab: 'orders' | 'new') { this.activeTab.set(tab); }
  toggle(id: string) { this.expanded.set(this.expanded() === id ? null : id); }
  selectCat(id: string) { this.activeCatId.set(id); }

  addToCart(dish: { id: string; name: string; price: number }) {
    this.cart.update(cart => {
      const existing = cart.find(i => i.dishId === dish.id);
      return existing
        ? cart.map(i => i.dishId === dish.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...cart, { dishId: dish.id, dishName: dish.name, dishPrice: dish.price, quantity: 1 }];
    });
  }

  removeFromCart(dishId: string) {
    this.cart.update(cart => {
      const item = cart.find(i => i.dishId === dishId);
      if (!item) return cart;
      if (item.quantity > 1) return cart.map(i => i.dishId === dishId ? { ...i, quantity: i.quantity - 1 } : i);
      return cart.filter(i => i.dishId !== dishId);
    });
  }

  getQty(dishId: string) { return this.cart().find(i => i.dishId === dishId)?.quantity ?? 0; }

  submitOrder() {
    const access = this.access();
    if (!access || !this.cart().length) return;
    this.saving.set(true);
    this.orderSvc.create(access.id, {
      type: 'TABLE',
      tableNumber:    this.tableNumber().trim() || undefined,
      notes:          this.notes().trim() || undefined,
      directDelivery: this.directDelivery(),
      items: this.cart().map(i => ({ dishId: i.dishId, quantity: i.quantity })),
    }).subscribe({
      next: () => {
        this.cart.set([]);
        this.tableNumber.set('');
        this.notes.set('');
        this.directDelivery.set(false);
        this.saving.set(false);
        this.activeTab.set('orders');
      },
      error: () => this.saving.set(false),
    });
  }

  updateStatus(order: Order, status: OrderStatus) {
    const access = this.access();
    if (!access) return;
    this.orderSvc.updateStatus(access.id, order.id, status).subscribe(updated => {
      this.orders.update(os => os.map(o => o.id === updated.id ? updated : o));
    });
  }

  togglePayment(order: Order) {
    const access = this.access();
    if (!access) return;
    this.orderSvc.updatePayment(access.id, order.id, !order.isPaid).subscribe(updated => {
      this.orders.update(os => os.map(o => o.id === updated.id ? updated : o));
    });
  }

  waiterActions(order: Order): OrderStatus[] {
    const map: Partial<Record<OrderStatus, OrderStatus[]>> = {
      PENDING: ['SERVED', 'CANCELLED'],
      READY:   ['SERVED'],
      SERVED:  ['FINISHED'],
    };
    return map[order.status] ?? [];
  }
}

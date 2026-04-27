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
import { RoomsService } from '../../../rooms/rooms.service';
import {
  MemberAccess, Order, OrderStatus,
  STATUS_COLOR, STATUS_LABEL,
} from '../../../orders/order.model';
import { PublicCategory } from '../../../menu/menu.model';
import { Room, RoomTable } from '../../../rooms/rooms.model';

interface CartItem { dishId: string; dishName: string; dishPrice: number; quantity: number; notes?: string; }

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
  private roomsSvc = inject(RoomsService);

  readonly loading    = signal(true);
  readonly error      = signal('');
  readonly access     = signal<MemberAccess | null>(null);
  readonly orders     = signal<Order[]>([]);
  readonly rooms      = signal<Room[]>([]);
  readonly activeTab  = signal<'tables' | 'orders' | 'new'>('tables');
  readonly expanded   = signal<string | null>(null);

  readonly categories     = signal<PublicCategory[]>([]);
  readonly activeCatId    = signal<string | null>(null);
  readonly cart           = signal<CartItem[]>([]);
  readonly directDelivery = signal(false);
  readonly saving         = signal(false);
  readonly noteOpen       = signal<Record<string, boolean>>({});

  readonly selectedTableId   = signal<string | null>(null);
  readonly selectedTableName = signal<string>('');

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
        this.loadRooms(access.id);
        this.sseSub = this.sseSvc.connect(access.id).subscribe({
          next: ({ event, data }) => {
            if (event === 'order.created') {
              this.orders.update(os => [data, ...os]);
            } else {
              this.orders.update(os => os.map(o => o.id === data.id ? data : o));
            }
            if (data.tableId) this.syncTableOrder(data);
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

  private loadRooms(restaurantId: string) {
    this.roomsSvc.list(restaurantId).subscribe(rooms => this.rooms.set(rooms));
  }

  private syncTableOrder(order: Order) {
    const isActive = !['FINISHED', 'CANCELLED'].includes(order.status);
    this.rooms.update(rooms => rooms.map(room => ({
      ...room,
      tables: room.tables.map(t =>
        t.id === order.tableId
          ? { ...t, activeOrder: isActive ? { id: order.id, status: order.status, total: order.total } : null }
          : t,
      ),
    })));
  }

  setTab(tab: 'tables' | 'orders' | 'new') { this.activeTab.set(tab); }
  toggle(id: string) { this.expanded.set(this.expanded() === id ? null : id); }
  selectCat(id: string) { this.activeCatId.set(id); }

  tableStatus(table: RoomTable): 'free' | 'occupied' | 'served' {
    if (!table.activeOrder) return 'free';
    if (table.activeOrder.status === 'SERVED') return 'served';
    return 'occupied';
  }

  pickTable(table: RoomTable) {
    const status = this.tableStatus(table);
    if (status !== 'free') {
      const order = this.orders().find(o =>
        o.tableId === table.id && !['FINISHED', 'CANCELLED'].includes(o.status),
      );
      if (order) {
        this.expanded.set(order.id);
        this.activeTab.set('orders');
      }
      return;
    }
    this.selectedTableId.set(table.id);
    this.selectedTableName.set(table.name);
    this.cart.set([]);
    this.noteOpen.set({});
    this.directDelivery.set(false);
    this.activeTab.set('new');
  }

  goPickTable() { this.activeTab.set('tables'); }

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
      this.noteOpen.update(s => { const n = { ...s }; delete n[dishId]; return n; });
      return cart.filter(i => i.dishId !== dishId);
    });
  }

  toggleNote(dishId: string) {
    this.noteOpen.update(s => ({ ...s, [dishId]: !s[dishId] }));
  }

  isNoteOpen(dishId: string) { return this.noteOpen()[dishId] ?? false; }

  getQty(dishId: string)  { return this.cart().find(i => i.dishId === dishId)?.quantity ?? 0; }
  getNote(dishId: string) { return this.cart().find(i => i.dishId === dishId)?.notes ?? ''; }

  setNote(dishId: string, note: string) {
    this.cart.update(cart =>
      cart.map(i => i.dishId === dishId ? { ...i, notes: note.trim() || undefined } : i),
    );
  }

  submitOrder() {
    const access = this.access();
    if (!access || !this.cart().length) return;
    this.saving.set(true);
    this.orderSvc.create(access.id, {
      type:           'TABLE',
      tableId:        this.selectedTableId() ?? undefined,
      directDelivery: this.directDelivery(),
      items: this.cart().map(i => ({ dishId: i.dishId, quantity: i.quantity, notes: i.notes })),
    }).subscribe({
      next: order => {
        this.cart.set([]);
        this.noteOpen.set({});
        this.directDelivery.set(false);
        this.saving.set(false);
        this.selectedTableId.set(null);
        this.selectedTableName.set('');
        if (order.tableId) this.syncTableOrder(order);
        this.expanded.set(order.id);
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
      if (updated.tableId) this.syncTableOrder(updated);
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

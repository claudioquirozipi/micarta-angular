import {
  ChangeDetectionStrategy, Component, OnInit,
  computed, inject, signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { PublicMenuService } from '../../../menu/public-menu.service';
import { OrderService } from '../../../orders/order.service';
import { PublicDish } from '../../../menu/menu.model';

interface ResolvedItem { dish: PublicDish; quantity: number; subtotal: number; }

@Component({
  selector: 'app-confirm-order',
  imports: [RouterLink],
  templateUrl: './confirm-order.html',
  styleUrl: './confirm-order.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmOrder implements OnInit {
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private authSvc    = inject(AuthService);
  private menuSvc    = inject(PublicMenuService);
  private orderSvc   = inject(OrderService);

  readonly loading    = signal(true);
  readonly saving     = signal(false);
  readonly error      = signal('');
  readonly success    = signal(false);
  readonly items      = signal<ResolvedItem[]>([]);
  readonly restaurantId = signal('');
  readonly restaurantName = signal('');

  // Customer info from URL
  readonly customerName    = signal('');
  readonly customerPhone   = signal('');
  readonly customerAddress = signal('');

  readonly total = computed(() =>
    this.items().reduce((s, i) => s + i.subtotal, 0),
  );

  readonly isLoggedIn = computed(() => !!this.authSvc.user());

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    const qp   = this.route.snapshot.queryParamMap;

    this.customerName.set(qp.get('name') ?? '');
    this.customerPhone.set(qp.get('phone') ?? '');
    this.customerAddress.set(qp.get('address') ?? '');

    const rawItems = qp.get('items') ?? '';

    this.menuSvc.getMenu(slug).subscribe({
      next: menu => {
        this.restaurantId.set(menu.restaurant.id);
        this.restaurantName.set(menu.restaurant.name);

        const allDishes = menu.categories.flatMap(c => c.dishes);
        const dishMap   = new Map(allDishes.map(d => [d.id, d]));

        const resolved = rawItems
          .split(',')
          .map(part => {
            const [dishId, qtyStr] = part.split(':');
            const qty  = parseInt(qtyStr, 10);
            const dish = dishMap.get(dishId);
            if (!dish || isNaN(qty) || qty < 1) return null;
            return { dish, quantity: qty, subtotal: Math.round(dish.price * qty * 100) / 100 };
          })
          .filter((i): i is ResolvedItem => i !== null);

        if (!resolved.length) {
          this.error.set('No se encontraron platos válidos en este enlace.');
        }
        this.items.set(resolved);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el menú.');
        this.loading.set(false);
      },
    });
  }

  confirm() {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    this.saving.set(true);
    this.orderSvc.create(this.restaurantId(), {
      type:            'WHATSAPP',
      customerName:    this.customerName() || undefined,
      customerPhone:   this.customerPhone() || undefined,
      customerAddress: this.customerAddress() || undefined,
      items: this.items().map(i => ({ dishId: i.dish.id, quantity: i.quantity })),
    }).subscribe({
      next:  () => { this.saving.set(false); this.success.set(true); },
      error: () => { this.saving.set(false); this.error.set('Error al confirmar el pedido.'); },
    });
  }
}

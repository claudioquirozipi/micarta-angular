import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicMenuService } from '../../../menu/public-menu.service';
import { PublicDish, PublicMenu, CartEntry } from '../../../menu/menu.model';

@Component({
  selector: 'app-restaurant-menu',
  imports: [FormsModule],
  templateUrl: './restaurant-menu.html',
  styleUrl: './restaurant-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantMenu implements OnInit {
  private route   = inject(ActivatedRoute);
  private menuSvc = inject(PublicMenuService);

  readonly menu        = signal<PublicMenu | null>(null);
  readonly loading     = signal(true);
  readonly error       = signal('');
  readonly activeCatId = signal<string | null>(null);
  readonly cartOpen    = signal(false);
  readonly cart        = signal<CartEntry[]>([]);

  readonly customerName    = signal('');
  readonly customerPhone   = signal('');
  readonly customerAddress = signal('');
  readonly nameError       = signal(false);

  readonly cartCount = computed(() => this.cart().reduce((s, e) => s + e.quantity, 0));
  readonly cartTotal = computed(() => this.cart().reduce((s, e) => s + e.dish.price * e.quantity, 0));
  readonly categories = computed(() => this.menu()?.categories ?? []);
  readonly restaurant = computed(() => this.menu()?.restaurant ?? null);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.menuSvc.getMenu(slug).subscribe({
      next: data => {
        this.menu.set(data);
        if (data.categories.length) this.activeCatId.set(data.categories[0].id);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se encontró el menú.');
        this.loading.set(false);
      },
    });
  }

  selectCategory(id: string) { this.activeCatId.set(id); }

  getQty(dishId: string): number {
    return this.cart().find(e => e.dish.id === dishId)?.quantity ?? 0;
  }

  add(dish: PublicDish) {
    this.cart.update(cart => {
      const existing = cart.find(e => e.dish.id === dish.id);
      return existing
        ? cart.map(e => e.dish.id === dish.id ? { ...e, quantity: e.quantity + 1 } : e)
        : [...cart, { dish, quantity: 1 }];
    });
  }

  remove(dishId: string) {
    this.cart.update(cart => {
      const existing = cart.find(e => e.dish.id === dishId);
      if (!existing) return cart;
      if (existing.quantity > 1)
        return cart.map(e => e.dish.id === dishId ? { ...e, quantity: e.quantity - 1 } : e);
      return cart.filter(e => e.dish.id !== dishId);
    });
  }

  sendWhatsApp() {
    const name = this.customerName().trim();
    if (!name) { this.nameError.set(true); return; }
    this.nameError.set(false);

    const r = this.restaurant();
    if (!r?.whatsapp) return;

    const items  = this.cart().map(e => `${e.dish.id}:${e.quantity}`).join(',');
    const params = new URLSearchParams({ items });
    if (name) params.set('name', name);
    if (this.customerPhone().trim()) params.set('phone', this.customerPhone().trim());
    if (this.customerAddress().trim()) params.set('address', this.customerAddress().trim());

    const confirmUrl = `${window.location.origin}/r/${r.slug}/confirmar?${params.toString()}`;

    const lines = this.cart().map(
      e => `• ${e.quantity}x ${e.dish.name} — S/ ${(e.dish.price * e.quantity).toFixed(2)}`,
    );

    const msgParts: string[] = [
      `Hola! Quiero hacer un pedido en ${r.name}:`,
      '',
      ...lines,
      '',
      `Total: S/ ${this.cartTotal().toFixed(2)}`,
      '',
      `Cliente: ${name}`,
    ];
    if (this.customerPhone().trim()) msgParts.push(`Teléfono: ${this.customerPhone().trim()}`);
    if (this.customerAddress().trim()) msgParts.push(`Dirección: ${this.customerAddress().trim()}`);
    msgParts.push('', confirmUrl);

    const phone = r.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msgParts.join('\n'))}`, '_blank');
  }

  activeDishes() {
    return this.categories().find(c => c.id === this.activeCatId())?.dishes ?? [];
  }
}

import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { RestaurantService } from '../../restaurant/services/restaurant.service';
import { NotificationsService } from '../../notifications/notifications.service';

interface NavItem { path: string; label: string; icon: string; }

const BASE_NAV: NavItem[] = [
  { path: '/dashboard/perfil',      label: 'Perfil',      icon: 'store'       },
  { path: '/dashboard/suscripcion', label: 'Suscripción', icon: 'credit_card' },
];

// Disponibles en cuanto hay restaurante (configuración, no requieren menú)
const SETUP_NAV: NavItem[] = [
  { path: '/dashboard/menu',    label: 'Menú',    icon: 'restaurant'   },
  { path: '/dashboard/salones', label: 'Salones', icon: 'meeting_room' },
  { path: '/dashboard/equipo',  label: 'Equipo',  icon: 'group'        },
  { path: '/dashboard/qr',      label: 'Mi QR',   icon: 'qr_code_2'   },
];

// Requieren al menos un plato en el menú
const OPERATIONAL_NAV: NavItem[] = [
  { path: '/dashboard/preview',   label: 'Vista previa', icon: 'visibility'  },
  { path: '/dashboard/ordenes',   label: 'Órdenes',      icon: 'receipt_long'},
  { path: '/dashboard/reportes',  label: 'Reportes',     icon: 'assessment'  },
];

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayout implements OnInit {
  readonly drawerOpen = signal(false);

  readonly navItems = computed(() => {
    const r = this.restaurantService.restaurant();
    if (!r) return BASE_NAV;
    if (!r.hasMenu) return [...BASE_NAV, ...SETUP_NAV];
    return [...BASE_NAV, ...SETUP_NAV, ...OPERATIONAL_NAV];
  });

  readonly staffItems = computed(() => {
    const slug = this.restaurantService.restaurant()?.slug;
    if (!slug) return [];
    return [
      { path: `/r/${slug}/mesero`, label: 'Mesero', icon: 'table_restaurant' },
      { path: `/r/${slug}/cocina`, label: 'Cocina',  icon: 'soup_kitchen'    },
    ];
  });

  constructor(
    private auth: AuthService,
    private restaurantService: RestaurantService,
    private router: Router,
    readonly notificationsSvc: NotificationsService,
  ) {}

  ngOnInit() {
    if (!this.restaurantService.loaded()) {
      this.restaurantService.loadMine().subscribe(() => this.redirectStaff());
    } else {
      this.redirectStaff();
    }
  }

  private redirectStaff() {
    const r = this.restaurantService.restaurant();
    if (r?.myRole === 'WAITER') this.router.navigate(['/r', r.slug, 'mesero']);
    else if (r?.myRole === 'CHEF') this.router.navigate(['/r', r.slug, 'cocina']);
  }

  openDrawer()  { this.drawerOpen.set(true);  }
  closeDrawer() { this.drawerOpen.set(false); }

  logout() {
    this.auth.logout();
  }
}

import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { RestaurantService } from '../../restaurant/services/restaurant.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayout implements OnInit {
  readonly drawerOpen = signal(false);

  readonly navItems: NavItem[] = [
    { path: '/dashboard/perfil',      label: 'Perfil',       icon: 'store'        },
    { path: '/dashboard/menu',        label: 'Menú',         icon: 'restaurant'   },
    { path: '/dashboard/ordenes',     label: 'Órdenes',      icon: 'receipt_long' },
    { path: '/dashboard/equipo',      label: 'Equipo',       icon: 'group'        },
    { path: '/dashboard/preview',     label: 'Vista previa', icon: 'visibility'   },
    { path: '/dashboard/qr',          label: 'Mi QR',        icon: 'qr_code_2'   },
    { path: '/dashboard/suscripcion', label: 'Suscripción',  icon: 'credit_card'  },
  ];

  constructor(
    private auth: AuthService,
    private restaurantService: RestaurantService,
    private router: Router,
  ) {}

  ngOnInit() {
    // Carga el restaurante una sola vez al entrar al dashboard.
    // Se usa loaded() como condición (no restaurant()) para cubrir el caso en que
    // restaurant fue seteado por create/update pero loaded todavía es false.
    if (!this.restaurantService.loaded()) {
      this.restaurantService.loadMine().subscribe();
    }
  }

  openDrawer()  { this.drawerOpen.set(true);  }
  closeDrawer() { this.drawerOpen.set(false); }

  logout() {
    this.auth.logout();
  }
}

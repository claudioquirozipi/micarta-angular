import { Injectable, computed, inject } from '@angular/core';
import { RestaurantService } from '../restaurant/services/restaurant.service';
import { AppNotification } from './notifications.model';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private restaurantSvc = inject(RestaurantService);

  readonly notifications = computed((): AppNotification[] => {
    if (!this.restaurantSvc.loaded()) return [];

    const list: AppNotification[] = [];

    if (!this.restaurantSvc.restaurant()) {
      list.push({
        id:          'no-restaurant',
        title:       'Crea tu restaurante',
        message:     'Para acceder a todas las funciones primero debes crear el perfil de tu restaurante. Solo toma unos minutos.',
        actionLabel: 'Crear restaurante',
        actionPath:  '/dashboard/perfil',
      });
    }

    return list;
  });

  readonly count            = computed(() => this.notifications().length);
  readonly hasNotifications = computed(() => this.count() > 0);
}

import { Injectable, computed, inject } from '@angular/core';
import { RestaurantService } from '../restaurant/services/restaurant.service';
import { AppNotification } from './notifications.model';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private restaurantSvc = inject(RestaurantService);

  readonly notifications = computed((): AppNotification[] => {
    if (!this.restaurantSvc.loaded()) return [];

    const list: AppNotification[] = [];

    const restaurant = this.restaurantSvc.restaurant();

    if (!restaurant) {
      list.push({
        id:          'no-restaurant',
        title:       'Crea tu restaurante',
        message:     'Para acceder a todas las funciones primero debes crear el perfil de tu restaurante. Solo toma unos minutos.',
        actionLabel: 'Crear restaurante',
        actionPath:  '/dashboard/perfil',
      });
      return list;
    }

    if (!restaurant.hasMenu) {
      list.push({
        id:          'no-menu',
        title:       'Agrega tu menú',
        message:     'Ya tienes tu restaurante listo. El siguiente paso es crear tu menú con categorías y platos para poder tomar órdenes.',
        actionLabel: 'Crear menú',
        actionPath:  '/dashboard/menu',
      });
    }

    const periodEnd = restaurant.subscriptionPeriodEnd;
    if (periodEnd) {
      const daysLeft = (new Date(periodEnd).getTime() - Date.now()) / 86_400_000;
      if (daysLeft <= 3 && daysLeft >= -3) {
        const fecha = new Date(periodEnd).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', timeZone: 'UTC' });
        const expired = daysLeft < 0;
        list.push({
          id:          'subscription-expiring',
          title:       expired ? 'Suscripción vencida' : 'Suscripción por vencer',
          message:     expired
            ? `Tu suscripción venció el ${fecha}. Tienes ${3 + Math.ceil(daysLeft)} días de gracia para renovar.`
            : `Tu suscripción vence el ${fecha}. Renueva para no perder el acceso.`,
          actionLabel: 'Renovar',
          actionPath:  '/dashboard/suscripcion',
        });
      }
    }

    return list;
  });

  readonly count            = computed(() => this.notifications().length);
  readonly hasNotifications = computed(() => this.count() > 0);
}

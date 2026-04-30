import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface RestaurantSubscription {
  restaurantId:       string;
  restaurantName:     string;
  restaurantSlug:     string;
  restaurantLogo:     string | null;
  ownerName:          string | null;
  ownerEmail:         string;
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | null;
  currentPeriodEnd:   string | null;
  subscribed:         boolean;
  isInGrace:          boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private api  = `${environment.apiUrl}/admin`;

  listSubscriptions() {
    return this.http.get<RestaurantSubscription[]>(`${this.api}/subscriptions`);
  }

  activateSubscription(restaurantId: string, periodEnd: string) {
    return this.http.post<{ success: boolean }>(
      `${this.api}/subscriptions/${restaurantId}/activate`,
      { periodEnd },
    );
  }
}

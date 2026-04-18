import { Injectable, inject, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';
import { Order } from './order.model';

export interface SseOrderEvent {
  event: 'order.created' | 'order.updated';
  data: Order;
}

@Injectable({ providedIn: 'root' })
export class OrderSseService {
  private authSvc = inject(AuthService);
  private zone    = inject(NgZone);

  connect(restaurantId: string): Observable<SseOrderEvent> {
    return new Observable(observer => {
      const token = this.authSvc.getToken();
      if (!token) { observer.error('No token'); return; }

      const url = `${environment.apiUrl}/restaurants/${restaurantId}/orders/events?token=${encodeURIComponent(token)}`;
      const es  = new EventSource(url);

      es.onmessage = (e: MessageEvent) => {
        this.zone.run(() => {
          try {
            observer.next(JSON.parse(e.data) as SseOrderEvent);
          } catch { /* skip malformed */ }
        });
      };

      es.onerror = () => {
        this.zone.run(() => observer.error('SSE connection error'));
        es.close();
      };

      return () => es.close();
    });
  }
}

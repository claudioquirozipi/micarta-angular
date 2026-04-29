import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Order, CreateOrderDto, AddOrderItemsDto, MemberAccess, OrderStatus, PaymentMethod } from './order.model';

const API = `${environment.apiUrl}/restaurants`;

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);

  memberAccess(slug: string) {
    return this.http.get<MemberAccess>(
      `${environment.apiUrl}/restaurants/member-access/${slug}`,
    );
  }

  list(restaurantId: string, params: Record<string, string> = {}) {
    return this.http.get<Order[]>(`${API}/${restaurantId}/orders`, { params });
  }

  create(restaurantId: string, dto: CreateOrderDto) {
    return this.http.post<Order>(`${API}/${restaurantId}/orders`, dto);
  }

  addItems(restaurantId: string, orderId: string, dto: AddOrderItemsDto) {
    return this.http.post<Order>(`${API}/${restaurantId}/orders/${orderId}/items`, dto);
  }

  updateStatus(restaurantId: string, orderId: string, status: OrderStatus) {
    return this.http.patch<Order>(
      `${API}/${restaurantId}/orders/${orderId}/status`,
      { status },
    );
  }

  updatePayment(restaurantId: string, orderId: string, isPaid: boolean, paymentMethod?: PaymentMethod, tip?: number) {
    return this.http.patch<Order>(
      `${API}/${restaurantId}/orders/${orderId}/payment`,
      { isPaid, paymentMethod, tip },
    );
  }
}

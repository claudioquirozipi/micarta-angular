import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Room, RoomTable } from './rooms.model';

const API = `${environment.apiUrl}/restaurants`;

@Injectable({ providedIn: 'root' })
export class RoomsService {
  private http = inject(HttpClient);

  list(restaurantId: string) {
    return this.http.get<Room[]>(`${API}/${restaurantId}/rooms`);
  }

  createRoom(restaurantId: string, name: string) {
    return this.http.post<{ id: string; name: string }>(`${API}/${restaurantId}/rooms`, { name });
  }

  updateRoom(restaurantId: string, roomId: string, name: string) {
    return this.http.patch<{ id: string; name: string }>(`${API}/${restaurantId}/rooms/${roomId}`, { name });
  }

  deleteRoom(restaurantId: string, roomId: string) {
    return this.http.delete<void>(`${API}/${restaurantId}/rooms/${roomId}`);
  }

  createTable(restaurantId: string, roomId: string, name: string) {
    return this.http.post<RoomTable>(`${API}/${restaurantId}/rooms/${roomId}/tables`, { name });
  }

  updateTable(restaurantId: string, roomId: string, tableId: string, dto: { name?: string; isActive?: boolean }) {
    return this.http.patch<RoomTable>(`${API}/${restaurantId}/rooms/${roomId}/tables/${tableId}`, dto);
  }

  deleteTable(restaurantId: string, roomId: string, tableId: string) {
    return this.http.delete<void>(`${API}/${restaurantId}/rooms/${roomId}/tables/${tableId}`);
  }
}

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Restaurant,
  CreateRestaurantDto,
  UpdateRestaurantDto,
  MembersResponse,
  InviteMemberDto,
  UpdateMemberDto,
} from '../models/restaurant.model';

const API = `${environment.apiUrl}/restaurants`;

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private _restaurant = signal<Restaurant | null>(null);
  private _loaded     = signal(false);

  /** Restaurante del usuario autenticado (null = sin restaurante aún). */
  readonly restaurant = this._restaurant.asReadonly();

  /**
   * true una vez que loadMine() completó (con o sin restaurante).
   * Los componentes hijos lo usan para saber que ya pueden leer el signal.
   */
  readonly loaded = this._loaded.asReadonly();

  constructor(private http: HttpClient) {}

  loadMine() {
    return this.http.get<Restaurant | null>(`${API}/mine`).pipe(
      tap(r => {
        this._restaurant.set(r);
        this._loaded.set(true);
      }),
    );
  }

  create(dto: CreateRestaurantDto) {
    return this.http.post<Restaurant>(API, dto).pipe(
      tap(r => this._restaurant.set(r)),
    );
  }

  update(id: string, dto: UpdateRestaurantDto) {
    return this.http.patch<Restaurant>(`${API}/${id}`, dto).pipe(
      tap(r => this._restaurant.set(r)),
    );
  }

  // ── Members ─────────────────────────────────────────────────────────────────

  getMembers(restaurantId: string) {
    return this.http.get<MembersResponse>(`${API}/${restaurantId}/members`);
  }

  inviteMember(restaurantId: string, dto: InviteMemberDto) {
    return this.http.post<unknown>(`${API}/${restaurantId}/members/invite`, dto);
  }

  updateMember(restaurantId: string, memberId: string, dto: UpdateMemberDto) {
    return this.http.patch<unknown>(`${API}/${restaurantId}/members/${memberId}`, dto);
  }

  removeMember(restaurantId: string, memberId: string) {
    return this.http.delete<void>(`${API}/${restaurantId}/members/${memberId}`);
  }

  cancelInvitation(restaurantId: string, invitationId: string) {
    return this.http.delete<void>(`${API}/${restaurantId}/members/invitations/${invitationId}`);
  }
}

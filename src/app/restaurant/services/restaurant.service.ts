import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Restaurant,
  SignedUploadParams,
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

  private _mine$: Observable<Restaurant | null> | null = null;

  constructor(private http: HttpClient) {}

  loadMine(): Observable<Restaurant | null> {
    if (!this._mine$) {
      this._mine$ = this.http.get<Restaurant | null>(`${API}/mine`).pipe(
        tap(r => {
          this._restaurant.set(r);
          this._loaded.set(true);
        }),
        catchError(() => {
          this._loaded.set(true);
          return of(null);
        }),
        shareReplay(1),
      );
    }
    return this._mine$;
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

  signLogoUpload(restaurantId: string) {
    return this.http.post<SignedUploadParams>(`${API}/${restaurantId}/logo/sign`, {});
  }

  updateLogo(restaurantId: string, logoUrl: string) {
    return this.http.patch<{ id: string; logoUrl: string }>(`${API}/${restaurantId}/logo`, { logoUrl }).pipe(
      tap(r => {
        const current = this._restaurant();
        if (current) this._restaurant.set({ ...current, logoUrl: r.logoUrl });
      }),
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

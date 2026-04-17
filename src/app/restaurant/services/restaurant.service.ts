import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Restaurant,
  CreateRestaurantDto,
  UpdateRestaurantDto,
} from '../models/restaurant.model';

const API = `${environment.apiUrl}/restaurants`;

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private _restaurant = signal<Restaurant | null>(null);
  readonly restaurant = this._restaurant.asReadonly();

  constructor(private http: HttpClient) {}

  loadMine() {
    return this.http.get<Restaurant | null>(`${API}/mine`).pipe(
      tap(r => this._restaurant.set(r)),
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
}

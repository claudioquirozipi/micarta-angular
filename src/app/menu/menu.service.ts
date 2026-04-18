import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { SignedUploadParams } from '../restaurant/models/restaurant.model';
import {
  Category,
  Dish,
  CreateCategoryDto,
  CreateDishDto,
  UpdateDishDto,
} from './menu.model';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class MenuService {
  constructor(private http: HttpClient) {}

  // ── Categories ──────────────────────────────────────────────────────────────

  getCategories(restaurantId: string) {
    return this.http.get<Category[]>(`${API}/restaurants/${restaurantId}/categories`);
  }

  createCategory(restaurantId: string, dto: CreateCategoryDto) {
    return this.http.post<Category>(`${API}/restaurants/${restaurantId}/categories`, dto);
  }

  updateCategory(restaurantId: string, categoryId: string, dto: { name: string }) {
    return this.http.patch<Category>(`${API}/restaurants/${restaurantId}/categories/${categoryId}`, dto);
  }

  deleteCategory(restaurantId: string, categoryId: string) {
    return this.http.delete<void>(`${API}/restaurants/${restaurantId}/categories/${categoryId}`);
  }

  // ── Dishes ──────────────────────────────────────────────────────────────────

  createDish(restaurantId: string, dto: CreateDishDto) {
    return this.http.post<Dish>(`${API}/restaurants/${restaurantId}/dishes`, dto);
  }

  updateDish(restaurantId: string, dishId: string, dto: UpdateDishDto) {
    return this.http.patch<Dish>(`${API}/restaurants/${restaurantId}/dishes/${dishId}`, dto);
  }

  toggleAvailability(restaurantId: string, dishId: string, isAvailable: boolean) {
    return this.http.patch<Dish>(
      `${API}/restaurants/${restaurantId}/dishes/${dishId}/availability`,
      { isAvailable },
    );
  }

  deleteDish(restaurantId: string, dishId: string) {
    return this.http.delete<void>(`${API}/restaurants/${restaurantId}/dishes/${dishId}`);
  }

  signDishImageUpload(restaurantId: string, dishId: string) {
    return this.http.post<SignedUploadParams>(
      `${API}/restaurants/${restaurantId}/dishes/${dishId}/image/sign`,
      {},
    );
  }

  updateDishImage(restaurantId: string, dishId: string, imageUrl: string) {
    return this.http.patch<{ id: string; imageUrl: string }>(
      `${API}/restaurants/${restaurantId}/dishes/${dishId}/image`,
      { imageUrl },
    );
  }
}

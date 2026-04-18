import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { RestaurantService } from '../../../restaurant/services/restaurant.service';
import { MenuService } from '../../../menu/menu.service';
import { SignedUploadParams } from '../../../restaurant/models/restaurant.model';
import { Category, Dish } from '../../../menu/menu.model';

const MAX_IMG_BYTES = 2 * 1024 * 1024;

@Component({
  selector: 'app-dashboard-menu',
  imports: [FormsModule],
  templateUrl: './dashboard-menu.html',
  styleUrl: './dashboard-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardMenu implements OnInit {
  private restaurantSvc = inject(RestaurantService);
  private menuSvc       = inject(MenuService);
  private http          = inject(HttpClient);

  readonly restaurant = this.restaurantSvc.restaurant;
  readonly loading    = signal(true);
  readonly categories = signal<Category[]>([]);

  readonly activeCatId = signal<string | null>(null);
  readonly activeCategory = computed(() =>
    this.categories().find(c => c.id === this.activeCatId()) ?? null,
  );
  readonly activeDishes = computed(() => this.activeCategory()?.dishes ?? []);

  // ── Category form ────────────────────────────────────────
  readonly showCatForm   = signal(false);
  readonly editingCat    = signal<Category | null>(null);
  readonly catName       = signal('');
  readonly catSaving     = signal(false);

  // ── Dish form ────────────────────────────────────────────
  readonly showDishForm  = signal(false);
  readonly editingDish   = signal<Dish | null>(null);
  readonly dishName      = signal('');
  readonly dishDesc      = signal('');
  readonly dishPrice     = signal('');
  readonly dishAvailable = signal(true);
  readonly dishSaving    = signal(false);
  readonly dishImgPreview    = signal<string | null>(null);
  readonly dishImgUploading  = signal(false);
  readonly dishImgError      = signal('');
  readonly pendingImageFile  = signal<File | null>(null);

  ngOnInit() {
    if (this.restaurantSvc.loaded()) {
      this.loadCategories();
    } else {
      this.restaurantSvc.loadMine().subscribe(() => this.loadCategories());
    }
  }

  private loadCategories() {
    const r = this.restaurant();
    if (!r) { this.loading.set(false); return; }
    this.menuSvc.getCategories(r.id).subscribe({
      next: cats => {
        this.categories.set(cats);
        if (!this.activeCatId() && cats.length) this.activeCatId.set(cats[0].id);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectCategory(id: string) { this.activeCatId.set(id); }

  // ── Category CRUD ────────────────────────────────────────

  openAddCategory() {
    this.editingCat.set(null);
    this.catName.set('');
    this.showCatForm.set(true);
  }

  openEditCategory(cat: Category, event: Event) {
    event.stopPropagation();
    this.editingCat.set(cat);
    this.catName.set(cat.name);
    this.showCatForm.set(true);
  }

  closeCatForm() { this.showCatForm.set(false); }

  saveCat() {
    const r = this.restaurant();
    const name = this.catName().trim();
    if (!r || !name) return;
    this.catSaving.set(true);

    const editing = this.editingCat();
    const obs$ = editing
      ? this.menuSvc.updateCategory(r.id, editing.id, { name })
      : this.menuSvc.createCategory(r.id, { name });

    obs$.subscribe({
      next: cat => {
        this.categories.update(cats => {
          if (editing) return cats.map(c => c.id === cat.id ? { ...c, name: cat.name } : c);
          const newCat = { ...cat, dishes: [] };
          this.activeCatId.set(newCat.id);
          return [...cats, newCat];
        });
        this.catSaving.set(false);
        this.showCatForm.set(false);
      },
      error: () => this.catSaving.set(false),
    });
  }

  deleteCategory(cat: Category, event: Event) {
    event.stopPropagation();
    if (!confirm(`¿Eliminar la categoría "${cat.name}" y todos sus platos?`)) return;
    const r = this.restaurant();
    if (!r) return;
    this.menuSvc.deleteCategory(r.id, cat.id).subscribe(() => {
      this.categories.update(cats => cats.filter(c => c.id !== cat.id));
      if (this.activeCatId() === cat.id) {
        const remaining = this.categories();
        this.activeCatId.set(remaining.length ? remaining[0].id : null);
      }
    });
  }

  // ── Dish CRUD ────────────────────────────────────────────

  openAddDish() {
    this.editingDish.set(null);
    this.dishName.set('');
    this.dishDesc.set('');
    this.dishPrice.set('');
    this.dishAvailable.set(true);
    this.dishImgPreview.set(null);
    this.dishImgError.set('');
    this.pendingImageFile.set(null);
    this.showDishForm.set(true);
  }

  openEditDish(dish: Dish) {
    this.editingDish.set(dish);
    this.dishName.set(dish.name);
    this.dishDesc.set(dish.description ?? '');
    this.dishPrice.set(String(dish.price));
    this.dishAvailable.set(dish.isAvailable);
    this.dishImgPreview.set(dish.imageUrl);
    this.dishImgError.set('');
    this.pendingImageFile.set(null);
    this.showDishForm.set(true);
  }

  closeDishForm() { this.showDishForm.set(false); }

  saveDish() {
    const r   = this.restaurant();
    const cat = this.activeCategory();
    const name  = this.dishName().trim();
    const price = parseFloat(this.dishPrice());
    if (!r || !cat || !name || isNaN(price) || price < 0) return;

    this.dishSaving.set(true);
    const editing      = this.editingDish();
    const pendingFile  = this.pendingImageFile();
    const dto = {
      name,
      description: this.dishDesc().trim() || undefined,
      price,
      categoryId:  cat.id,
      isAvailable: this.dishAvailable(),
    };

    const save$ = editing
      ? this.menuSvc.updateDish(r.id, editing.id, dto)
      : this.menuSvc.createDish(r.id, dto);

    save$.pipe(
      switchMap(dish => {
        if (editing || !pendingFile) return of(dish);
        return this.uploadDishImage(r.id, dish.id, pendingFile).pipe(
          map(updated => ({ ...dish, imageUrl: updated.imageUrl })),
          catchError(() => {
            this.dishImgError.set('Plato creado, pero falló la imagen. Puedes subirla luego.');
            return of(dish);
          }),
        );
      }),
    ).subscribe({
      next: dish => {
        this.categories.update(cats => cats.map(c =>
          c.id === cat.id
            ? { ...c, dishes: editing
                ? c.dishes.map(d => d.id === dish.id ? dish : d)
                : [...c.dishes, dish] }
            : c,
        ));
        this.dishSaving.set(false);
        this.showDishForm.set(false);
      },
      error: () => this.dishSaving.set(false),
    });
  }

  toggleAvailability(dish: Dish) {
    const r = this.restaurant();
    if (!r) return;
    this.menuSvc.toggleAvailability(r.id, dish.id, !dish.isAvailable).subscribe(updated => {
      this.categories.update(cats => cats.map(c =>
        c.id === dish.categoryId
          ? { ...c, dishes: c.dishes.map(d => d.id === updated.id ? updated : d) }
          : c,
      ));
    });
  }

  deleteDish(dish: Dish) {
    if (!confirm(`¿Eliminar "${dish.name}"?`)) return;
    const r = this.restaurant();
    if (!r) return;
    this.menuSvc.deleteDish(r.id, dish.id).subscribe(() => {
      this.categories.update(cats => cats.map(c =>
        c.id === dish.categoryId
          ? { ...c, dishes: c.dishes.filter(d => d.id !== dish.id) }
          : c,
      ));
    });
  }

  // ── Dish image upload ────────────────────────────────────

  onDishImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    this.dishImgError.set('');
    if (file.size > MAX_IMG_BYTES) { this.dishImgError.set('Máx. 2 MB.'); return; }

    this.dishImgPreview.set(URL.createObjectURL(file));

    const editing = this.editingDish();
    if (!editing) {
      this.pendingImageFile.set(file);
      return;
    }

    const r = this.restaurant();
    if (!r) return;

    this.dishImgUploading.set(true);
    this.uploadDishImage(r.id, editing.id, file).subscribe({
      next: updated => {
        this.categories.update(cats => cats.map(c =>
          c.id === editing.categoryId
            ? { ...c, dishes: c.dishes.map(d => d.id === updated.id ? { ...d, imageUrl: updated.imageUrl } : d) }
            : c,
        ));
        this.dishImgUploading.set(false);
      },
      error: () => { this.dishImgError.set('Error al subir imagen.'); this.dishImgUploading.set(false); },
    });
  }

  private uploadDishImage(restaurantId: string, dishId: string, file: File) {
    return this.menuSvc.signDishImageUpload(restaurantId, dishId).pipe(
      switchMap((params: SignedUploadParams) => {
        const fd = new FormData();
        fd.append('file',      file);
        fd.append('api_key',   params.apiKey);
        fd.append('timestamp', String(params.timestamp));
        fd.append('signature', params.signature);
        fd.append('public_id', params.publicId);
        fd.append('overwrite', 'true');
        return this.http.post<{ secure_url: string }>(
          `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`, fd,
        );
      }),
      switchMap(res => this.menuSvc.updateDishImage(restaurantId, dishId, res.secure_url)),
    );
  }
}

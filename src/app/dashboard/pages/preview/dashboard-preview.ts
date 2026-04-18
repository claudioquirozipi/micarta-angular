import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { RestaurantService } from '../../../restaurant/services/restaurant.service';

@Component({
  selector: 'app-dashboard-preview',
  imports: [RouterLink],
  templateUrl: './dashboard-preview.html',
  styleUrl: './dashboard-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPreview implements OnInit {
  private restaurantSvc = inject(RestaurantService);
  private sanitizer     = inject(DomSanitizer);

  readonly restaurant = this.restaurantSvc.restaurant;
  readonly loading    = signal(true);
  private readonly reloadKey = signal(0);

  readonly publicUrl = computed(() => {
    const slug = this.restaurant()?.slug;
    return slug ? `${window.location.origin}/r/${slug}` : '';
  });

  readonly iframeSrc = computed(() => {
    const url = this.publicUrl();
    const key = this.reloadKey();
    const src = url && key > 0 ? `${url}?_r=${key}` : url;
    return this.sanitizer.bypassSecurityTrustResourceUrl(src);
  });

  ngOnInit() {
    if (this.restaurantSvc.loaded()) {
      this.loading.set(false);
    } else {
      this.restaurantSvc.loadMine().subscribe(() => this.loading.set(false));
    }
  }

  reload() { this.reloadKey.update(k => k + 1); }
}

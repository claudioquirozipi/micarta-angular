import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationsService } from '../../../notifications/notifications.service';

@Component({
  selector: 'app-dashboard-notifications',
  imports: [],
  templateUrl: './dashboard-notifications.html',
  styleUrl: './dashboard-notifications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardNotifications {
  readonly notificationsSvc = inject(NotificationsService);
  private router            = inject(Router);

  navigate(path: string) { this.router.navigateByUrl(path); }
}

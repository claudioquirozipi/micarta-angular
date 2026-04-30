import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Toast, ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  readonly toastSvc = inject(ToastService);

  runAction(toast: Toast) {
    toast.actionFn?.();
    this.toastSvc.dismiss(toast.id);
  }
}

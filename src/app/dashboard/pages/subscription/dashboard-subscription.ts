import {
  ChangeDetectionStrategy, Component, OnInit,
  inject, signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  SubscriptionService,
  SubscriptionStatus,
  PendingPayment,
} from '../../../subscription/subscription.service';

@Component({
  selector: 'app-dashboard-subscription',
  imports: [DatePipe],
  templateUrl: './dashboard-subscription.html',
  styleUrl: './dashboard-subscription.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSubscription implements OnInit {
  private svc = inject(SubscriptionService);

  readonly loading        = signal(true);
  readonly status         = signal<SubscriptionStatus | null>(null);
  readonly pendingPayment = signal<PendingPayment | null>(null);
  readonly selectedMonths = signal(1);
  readonly requesting     = signal(false);
  readonly cancelling     = signal(false);
  readonly showCancel     = signal(false);

  readonly monthOptions  = [1, 2, 3, 6, 12];
  readonly payMethod     = signal<'yape' | 'card'>('yape');
  readonly cardLoading   = signal(false);
  readonly cardError     = signal('');

  ngOnInit() {
    this.load();
  }

  private load() {
    this.svc.getStatus().subscribe({
      next: s => {
        this.status.set(s);
        this.pendingPayment.set(s.pendingPayment);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get total() {
    const s = this.status();
    return s ? s.monthlyPrice * this.selectedMonths() : 0;
  }

  requestYape() {
    if (this.requesting()) return;
    this.requesting.set(true);
    this.svc.requestYape(this.selectedMonths()).subscribe({
      next: payment => {
        this.pendingPayment.set(payment);
        this.requesting.set(false);
      },
      error: () => this.requesting.set(false),
    });
  }

  async subscribeWithCard() {
    if (this.cardLoading()) return;
    this.cardError.set('');
    this.cardLoading.set(true);
    try {
      const token = await this.svc.openCulqiModal(this.status()!.monthlyPrice);
      this.svc.subscribeCard(token).subscribe({
        next: () => this.load(),
        error: (e) => {
          this.cardError.set(e?.error?.message ?? 'Error al procesar el pago.');
          this.cardLoading.set(false);
        },
      });
    } catch (e: any) {
      this.cardError.set(e?.message ?? 'Pago cancelado.');
      this.cardLoading.set(false);
    }
  }

  cancelSubscription() {
    if (this.cancelling()) return;
    this.cancelling.set(true);
    this.svc.cancel().subscribe({
      next: () => {
        this.showCancel.set(false);
        this.load();
      },
      error: () => this.cancelling.set(false),
    });
  }
}

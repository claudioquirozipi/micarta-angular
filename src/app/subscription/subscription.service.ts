import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

// ── Culqi.js global types ─────────────────────────────────
declare global {
  interface Window {
    Culqi: {
      publicKey: string;
      settings(opts: { title: string; currency: string; description: string; amount: number }): void;
      open(): void;
      close(): void;
      token?: { id: string };
      error?: { user_message: string };
    };
    culqi?(): void;
  }
}

export interface SubscriptionStatus {
  subscribed:       boolean;
  isInGrace:        boolean;
  currentPeriodEnd: string | null;
  status:           'ACTIVE' | 'CANCELLED' | 'EXPIRED' | null;
  billingDay:       number | null;
  monthlyPrice:     number;
  yapeNumber:       string;
  pendingPayment:   PendingPayment | null;
}

export interface PendingPayment {
  id:         string;
  months:     number;
  amount:     number;
  yapeNumber: string;
  createdAt:  string;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private http = inject(HttpClient);
  private api  = `${environment.apiUrl}/subscription`;

  getStatus() {
    return this.http.get<SubscriptionStatus>(`${this.api}/status`);
  }

  requestYape(months: number) {
    return this.http.post<PendingPayment>(`${this.api}/yape`, { months });
  }

  subscribeCard(culqiToken: string) {
    return this.http.post<{ success: boolean; currentPeriodEnd: string }>(
      `${this.api}/card`,
      { culqiToken },
    );
  }

  cancel() {
    return this.http.post<{ success: boolean }>(`${this.api}/cancel`, {});
  }

  /**
   * Abre el modal de Culqi y resuelve con el token cuando el usuario
   * completa o rechaza. Requiere que CULQI_PUBLIC_KEY esté configurada.
   */
  openCulqiModal(amountSoles: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const culqiPublicKey = (window as any).__CULQI_PK__
        ?? 'pk_test_REEMPLAZAR_CON_TU_PUBLIC_KEY';

      window.Culqi.publicKey = culqiPublicKey;
      window.Culqi.settings({
        title:       'MiCarta',
        currency:    'PEN',
        description: 'Suscripción mensual',
        amount:      Math.round(amountSoles * 100), // en céntimos
      });

      window.culqi = () => {
        if (window.Culqi.token) {
          resolve(window.Culqi.token.id);
        } else {
          reject(new Error(window.Culqi.error?.user_message ?? 'Pago cancelado'));
        }
        window.culqi = undefined;
      };

      window.Culqi.open();
    });
  }
}

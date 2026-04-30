import { Injectable, signal } from '@angular/core';

export interface Toast {
  id:           string;
  message:      string;
  actionLabel?: string;
  actionFn?:    () => void;
  duration:     number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(message: string, options?: { actionLabel?: string; actionFn?: () => void; duration?: number }) {
    const id = crypto.randomUUID();
    const toast: Toast = {
      id,
      message,
      actionLabel: options?.actionLabel,
      actionFn:    options?.actionFn,
      duration:    options?.duration ?? 5000,
    };
    this.toasts.update(ts => [...ts, toast]);
    setTimeout(() => this.dismiss(id), toast.duration);
  }

  dismiss(id: string) {
    this.toasts.update(ts => ts.filter(t => t.id !== id));
  }
}

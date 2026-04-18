import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import QRCode from 'qrcode';
import { RestaurantService } from '../../../restaurant/services/restaurant.service';

const SIZE     = 1000;
const QR_SIZE  = 680;
const PADDING  = 60;
const RADIUS   = 40;
const PRIMARY  = '#E85D04';

@Component({
  selector: 'app-dashboard-qr',
  imports: [RouterLink],
  templateUrl: './dashboard-qr.html',
  styleUrl: './dashboard-qr.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardQr implements OnInit, AfterViewInit {
  @ViewChild('qrCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private restaurantSvc = inject(RestaurantService);

  readonly restaurant = this.restaurantSvc.restaurant;
  readonly loading    = signal(true);
  readonly ready      = signal(false);
  readonly copied     = signal(false);

  get publicUrl(): string {
    const slug = this.restaurant()?.slug;
    return slug ? `${window.location.origin}/r/${slug}` : '';
  }

  ngOnInit() {
    if (this.restaurantSvc.loaded()) {
      this.loading.set(false);
      // Canvas aún no existe — esperamos un tick para que el @if lo renderice
      setTimeout(() => this.generateQR(), 0);
    } else {
      this.restaurantSvc.loadMine().subscribe(() => {
        this.loading.set(false);
        setTimeout(() => this.generateQR(), 0);
      });
    }
  }

  ngAfterViewInit() {}

  async generateQR() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.restaurant()) return;

    this.ready.set(false);
    const name = this.restaurant()!.name;
    const url  = this.publicUrl;

    canvas.width  = SIZE;
    canvas.height = SIZE + 160;

    const ctx = canvas.getContext('2d')!;

    // Fondo blanco con bordes redondeados
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, 0, 0, SIZE, SIZE + 160, RADIUS);
    ctx.fill();

    // Franja de color superior
    ctx.fillStyle = PRIMARY;
    roundRect(ctx, 0, 0, SIZE, 120, { tl: RADIUS, tr: RADIUS, bl: 0, br: 0 });
    ctx.fill();

    // Nombre del restaurante en la franja
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const maxWidth = SIZE - 80;
    let fontSize = 52;
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    while (ctx.measureText(name).width > maxWidth && fontSize > 28) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    }
    ctx.fillText(name, SIZE / 2, 60, maxWidth);

    // QR code
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: QR_SIZE,
      margin: 1,
      color: { dark: '#1A1A2E', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    });

    const qrImg = new Image();
    qrImg.src = qrDataUrl;
    await new Promise<void>(resolve => { qrImg.onload = () => resolve(); });

    const qrX = (SIZE - QR_SIZE) / 2;
    const qrY = 120 + PADDING;
    ctx.drawImage(qrImg, qrX, qrY, QR_SIZE, QR_SIZE);

    // Texto "Escanéame"
    ctx.fillStyle = '#1A1A2E';
    ctx.font = 'bold 38px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📱 Escanéame para ver el menú', SIZE / 2, qrY + QR_SIZE + 50);

    // URL pequeña debajo
    ctx.fillStyle = '#6B7280';
    ctx.font = '26px system-ui, sans-serif';
    ctx.fillText(url.replace(/^https?:\/\//, ''), SIZE / 2, qrY + QR_SIZE + 100);

    this.ready.set(true);
  }

  download() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-${this.restaurant()!.slug}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  copyUrl() {
    navigator.clipboard.writeText(this.publicUrl).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number | { tl: number; tr: number; bl: number; br: number },
) {
  const rad = typeof r === 'number' ? { tl: r, tr: r, bl: r, br: r } : r;
  ctx.beginPath();
  ctx.moveTo(x + rad.tl, y);
  ctx.lineTo(x + w - rad.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad.tr);
  ctx.lineTo(x + w, y + h - rad.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad.br, y + h);
  ctx.lineTo(x + rad.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad.bl);
  ctx.lineTo(x, y + rad.tl);
  ctx.quadraticCurveTo(x, y, x + rad.tl, y);
  ctx.closePath();
}

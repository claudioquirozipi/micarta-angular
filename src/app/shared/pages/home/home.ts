import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  readonly currentYear = new Date().getFullYear();
  openFaq = signal<number | null>(null);

  toggleFaq(i: number) {
    this.openFaq.set(this.openFaq() === i ? null : i);
  }

  // QR visual decoration — decorative pattern
  readonly qrCells: boolean[] = (() => {
    const p = [
      1,1,1,1,1,1,1,0,1,1,0,1,0,0,1,1,1,1,1,1,1,
      1,0,0,0,0,0,1,0,0,1,1,0,0,0,1,0,0,0,0,0,1,
      1,0,1,1,1,0,1,0,1,0,1,1,0,0,1,0,1,1,1,0,1,
      1,0,1,1,1,0,1,0,0,1,0,1,1,0,1,0,1,1,1,0,1,
      1,0,1,1,1,0,1,0,1,1,0,0,1,0,1,0,1,1,1,0,1,
      1,0,0,0,0,0,1,0,0,0,1,1,0,0,1,0,0,0,0,0,1,
      1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,
      0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,
      1,0,1,0,1,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,
      0,1,0,1,1,0,0,0,1,0,1,1,0,0,1,0,0,1,0,1,1,
      1,1,0,1,0,1,1,0,1,1,0,0,1,1,1,0,1,0,1,0,1,
      0,0,1,0,1,0,0,1,0,1,1,0,0,1,0,1,0,1,0,1,0,
      1,0,1,1,0,1,1,0,1,0,1,1,0,0,1,1,0,1,1,0,1,
      0,0,0,0,0,0,0,0,1,0,0,1,1,0,0,1,0,0,1,1,0,
      1,1,1,1,1,1,1,0,0,1,1,0,1,0,1,0,1,1,0,0,1,
      1,0,0,0,0,0,1,0,1,1,0,0,0,1,0,0,1,0,1,0,0,
      1,0,1,1,1,0,1,0,1,0,1,1,0,0,1,1,0,1,0,1,1,
      1,0,1,1,1,0,1,0,0,1,1,0,1,1,0,0,1,1,0,1,0,
      1,0,1,1,1,0,1,1,1,0,0,1,0,1,1,0,1,0,1,1,0,
      1,0,0,0,0,0,1,0,0,1,1,0,0,0,0,1,0,0,1,0,1,
      1,1,1,1,1,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,0,
    ];
    return p.map(v => v === 1);
  })();

  readonly pains = [
    { icon: '📋', text: 'Imprimir cartas cada vez que cambia el precio cuesta tiempo y dinero' },
    { icon: '😷', text: 'Las cartas de papel pasan por decenas de manos y acumulan gérmenes' },
    { icon: '📲', text: 'Gestionar pedidos por WhatsApp genera confusión y errores en la cocina' },
    { icon: '👨‍🍳', text: 'Sin sistema, cocina y mozos no están sincronizados y los platos se demoran' },
    { icon: '😤', text: 'No saber qué platos están agotados hasta que el cliente ya lo pidió' },
    { icon: '📊', text: 'Sin datos históricos de pedidos ni control de lo que más se vende' },
  ];

  readonly steps = [
    {
      icon: '🍽️',
      title: 'Crea tu carta',
      desc: 'Agrega categorías, platos, fotos, precios y descripciones en minutos. Sin conocimientos técnicos.',
    },
    {
      icon: '📱',
      title: 'Genera tu QR',
      desc: 'Descarga el código QR en alta resolución y ponlo en tus mesas, mostrador o redes sociales.',
    },
    {
      icon: '🚀',
      title: 'Gestiona en tiempo real',
      desc: 'Recibe pedidos, coordina con cocina, marca platos agotados y cobra todo desde tu celular.',
    },
  ];

  readonly features = [
    {
      icon: '📲',
      title: 'Menú digital con QR',
      desc: 'Tus clientes escanean el QR desde cualquier celular y ven tu carta al instante, sin descargar ninguna app.',
    },
    {
      icon: '🛒',
      title: 'Pedidos en tiempo real',
      desc: 'Los pedidos llegan directo a tu panel. Cocina y mozos los ven al mismo tiempo, sin errores de comunicación.',
    },
    {
      icon: '👨‍🍳',
      title: 'Panel de cocina',
      desc: 'Vista Kanban para el equipo de cocina: Pendiente → En preparación → Listo. Sin papeles, sin gritos.',
    },
    {
      icon: '🧾',
      title: 'Panel de mesero',
      desc: 'Tus mozos crean pedidos, marcan como pagado y gestionan el flujo de mesas desde el celular.',
    },
    {
      icon: '🔴',
      title: 'Control de disponibilidad',
      desc: 'Marca un plato como agotado en segundos. Los clientes lo verán de inmediato y no lo podrán pedir.',
    },
    {
      icon: '🔗',
      title: 'Link y QR únicos',
      desc: 'Tu carta tiene una URL propia (micarta.pe/tu-restaurante) que puedes compartir en redes o por WhatsApp.',
    },
    {
      icon: '📸',
      title: 'Fotos de tus platos',
      desc: 'Sube fotos atractivas de tus platos para despertar el apetito de tus clientes antes de ordenar.',
    },
    {
      icon: '👥',
      title: 'Gestión de equipo',
      desc: 'Invita a tu equipo con roles diferenciados: Dueño, Admin, Mozo o Cocinero. Cada uno ve lo que necesita.',
    },
    {
      icon: '💳',
      title: 'Pago con Yape o tarjeta',
      desc: 'Suscríbete como más te convenga: con Yape o tarjeta de crédito/débito. Seguro y sin sorpresas.',
    },
  ];

  readonly roles = [
    {
      icon: '👑',
      name: 'Dueño / Admin',
      items: [
        'Configura el perfil y la carta',
        'Ve todos los pedidos y métricas',
        'Gestiona el equipo y los roles',
        'Administra la suscripción',
        'Genera y descarga el código QR',
      ],
    },
    {
      icon: '🛎️',
      name: 'Mozo',
      items: [
        'Crea pedidos en mesa',
        'Registra el nombre y datos del cliente',
        'Marca pedidos como pagados',
        'Actualiza disponibilidad de platos',
        'Sigue el estado de cada orden',
      ],
    },
    {
      icon: '👨‍🍳',
      name: 'Cocinero',
      items: [
        'Ve los pedidos pendientes en tiempo real',
        'Empieza a preparar con un toque',
        'Marca los platos como listos',
        'Actualiza disponibilidad del menú',
        'Sin confusión con las comandas',
      ],
    },
  ];

  readonly priceItems = [
    'Menú digital con QR ilimitado',
    'Gestión de pedidos en tiempo real',
    'Panel de cocina (Kanban)',
    'Panel de mozo',
    'Equipo ilimitado (mozos y cocineros)',
    'Fotos de platos',
    'URL y QR personalizados',
    'Pago con Yape o tarjeta',
    'Soporte incluido',
  ];

  readonly faqs = [
    {
      q: '¿Necesito saber programar o tener conocimientos técnicos?',
      a: 'No. micartaApp está diseñado para que cualquier restaurante lo use sin ayuda técnica. En menos de 10 minutos tienes tu carta digital lista.',
    },
    {
      q: '¿Mis clientes necesitan descargar alguna app?',
      a: 'No. Tus clientes solo escanean el código QR con la cámara de su celular y ven el menú directamente en el navegador. Sin apps, sin registros.',
    },
    {
      q: '¿Qué pasa cuando termina el período de prueba?',
      a: 'Al cumplir los 14 días, tu cuenta entrará en período de gracia por 3 días. Después, deberás activar una suscripción para seguir gestionando pedidos. Tu carta seguirá visible para tus clientes.',
    },
    {
      q: '¿Puedo cancelar en cualquier momento?',
      a: 'Sí. No hay permanencia ni penalidades. Puedes cancelar cuando quieras desde tu panel de suscripción.',
    },
    {
      q: '¿Puedo pagar con Yape?',
      a: 'Sí. Aceptamos pagos por Yape (1, 2, 3, 6 o 12 meses) y también con tarjeta de crédito o débito a través de Culqi. Tu información de tarjeta nunca se almacena en nuestros servidores.',
    },
    {
      q: '¿Funciona para restaurantes con varios locales?',
      a: 'Actualmente puedes tener un restaurante por cuenta. Si tienes varios locales, puedes crear una cuenta para cada uno.',
    },
    {
      q: '¿Puedo actualizar el menú en cualquier momento?',
      a: 'Sí. Cualquier cambio que hagas en tu carta se refleja al instante para tus clientes. También puedes marcar platos como agotados en segundos.',
    },
  ];
}

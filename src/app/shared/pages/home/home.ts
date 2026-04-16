import { ChangeDetectionStrategy, Component } from '@angular/core';
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

  readonly steps = [
    {
      icon: '🍽️',
      title: 'Sube tu carta',
      desc: 'Agrega categorías y platos con fotos, descripciones y precios en minutos.'
    },
    {
      icon: '📱',
      title: 'Genera tu QR',
      desc: 'Descarga el QR en alta resolución e imprímelo para ponerlo en tus mesas.'
    },
    {
      icon: '✅',
      title: 'Listo',
      desc: 'Tus clientes escanean y ven tu carta al instante desde su celular.'
    }
  ];
}

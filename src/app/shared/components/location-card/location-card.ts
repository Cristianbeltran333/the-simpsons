import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpsonLocation } from '../../../core/interfaces/location.interface';
import { LocationModal } from '../location-modal/location-modal';
// 1. Importa el nuevo nombre (revisa que la ruta sea correcta)


@Component({
  selector: 'app-location-card',
  standalone: true,
  imports: [CommonModule, LocationModal],
  templateUrl: './location-card.html',
  styleUrl: './location-card.scss'
})
export class LocationCard {
  // 2. Usa el nuevo nombre aquí
  location = input.required<SimpsonLocation>();

  // 👇 3. Creamos la señal para controlar la visibilidad del modal
  isModalOpen = signal(false);

  // 👇 4. Funciones para abrir y cerrar
  openModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }
}

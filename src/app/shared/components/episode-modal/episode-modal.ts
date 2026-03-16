import { Component, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpsonEpisode } from '../../../core/interfaces/episode.interface';

@Component({
  selector: 'app-episode-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './episode-modal.html',
  styleUrl: './episode-modal.scss'
})
export class EpisodeModal implements OnInit {
  // Recibimos el episodio seleccionado
  episode = input.required<SimpsonEpisode>();

  // Emitimos un evento cuando el usuario quiera cerrar el modal
  closeModal = output<void>();

  // Señal para controlar la animación 3D (cerrada -> abierta)
  isOpen = signal(false);

  ngOnInit() {
    // Abrir la caja automáticamente después de un momentito para que se vea la animación
    setTimeout(() => {
      this.isOpen.set(true);
    }, 100);
  }

  // Cerrar la caja con animación antes de destruir el componente
  closeWithAnimation() {
    this.isOpen.set(false);
    // Esperar a que la caja se cierre por completo para desmontar el modal del DOM
    setTimeout(() => {
      this.closeModal.emit();
    }, 800); 
  }

  // Función para evitar que el clic dentro del modal cierre el overlay
  stopPropagation(event: Event) {
    event.stopPropagation();
  }
}

import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpsonEpisode } from '../../../core/interfaces/episode.interface';

@Component({
  selector: 'app-episode-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './episode-modal.html',
  styleUrl: './episode-modal.scss'
})
export class EpisodeModal {
  // Recibimos el episodio seleccionado
  episode = input.required<SimpsonEpisode>();

  // Emitimos un evento cuando el usuario quiera cerrar el modal
  closeModal = output<void>();

  // Función para evitar que el clic dentro del modal lo cierre
  stopPropagation(event: Event) {
    event.stopPropagation();
  }
}

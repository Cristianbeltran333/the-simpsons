import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Paginator } from '../../../shared/components/paginator/paginator';
import { SimpsonsApiService } from '../../../core/services/simpsons-api';
import { EpisodeCard } from '../../../shared/components/episode-card/episode-card';
import { SearchBar } from '../../../shared/components/search-bar/search-bar';
import { EpisodeModal } from '../../../shared/components/episode-modal/episode-modal';
import { SimpsonEpisode } from '../../../core/interfaces/episode.interface';


@Component({
  selector: 'app-episodes-list',
  standalone: true,
  imports: [CommonModule, Paginator, EpisodeCard, SearchBar, EpisodeModal],
  templateUrl: './episodes-list.html',
  styleUrl: './episodes-list.scss'
})
export class EpisodesList implements OnInit {
  // Inyectamos el servicio de forma pública para usar sus señales en el HTML
  public apiService = inject(SimpsonsApiService);

  // 👇 Estado para saber qué episodio está abierto (null = modal cerrado)
  selectedEpisode = signal<SimpsonEpisode | null>(null);

  ngOnInit(): void {
    // Al entrar a la vista, cargamos la página 1 por defecto
    this.apiService.getEpisodes(1);

    // Opcional: Si quieres que la vista empiece desde arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } // <-- ¡AQUÍ CERRAMOS EL ngOnInit!

  // 👇 Funciones para abrir y cerrar (ahora pertenecen a la clase, no al ngOnInit)
  openModal(episode: SimpsonEpisode) {
    this.selectedEpisode.set(episode);
  }

  closeModal() {
    this.selectedEpisode.set(null);
  }
}

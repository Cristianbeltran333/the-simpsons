import { Component, input } from '@angular/core';
import { SimpsonEpisode } from '../../../core/interfaces/episode.interface';


@Component({
  selector: 'app-episode-card',
  standalone: true,
  imports: [],
  templateUrl: './episode-card.html',
  styleUrl: './episode-card.scss'
})
export class EpisodeCard {
  // Recibimos la información del episodio
  episode = input.required<SimpsonEpisode>();
}

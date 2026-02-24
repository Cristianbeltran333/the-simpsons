import { Component, input, computed } from '@angular/core';
import { Character } from '../../../core/interfaces/character.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-character-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-card.html',
  styleUrl: './character-card.scss'
})
export class CharacterCard {
  character = input.required<Character>();

  // Armamos la URL exacta como lo hacías en Vanilla JS
  imgUrl = computed(() => {
    const path = this.character().portrait_path;
    // Si la API trae ruta, concatenamos el CDN. Si no, podemos poner un string vacío o una imagen de error.
    return path ? `https://cdn.thesimpsonsapi.com/500${path}` : '';
  });
}

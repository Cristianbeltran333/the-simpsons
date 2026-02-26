import { Component, inject, OnInit } from '@angular/core';
import { CharacterCard } from '../../../shared/components/character-card/character-card';
import { SimpsonsApiService } from '../../../core/services/simpsons-api';
import { SearchBar } from "../../../shared/components/search-bar/search-bar";
import { Paginator } from '../../../shared/components/paginator/paginator';

@Component({
  selector: 'app-characters-list',
  standalone: true,
  imports: [CharacterCard, SearchBar, Paginator],
  templateUrl: './characters-list.html',
  styleUrl: './characters-list.scss'
})
export class CharactersList implements OnInit {
  // Inyectamos el servicio que creamos
  apiService = inject(SimpsonsApiService);

  ngOnInit() {
    // Apenas cargue el componente, le pedimos a la API la página 1
    this.apiService.getCharacters(1);
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { CharacterCard } from '../../../shared/components/character-card/character-card';
import { SimpsonsApiService } from '../../../core/services/simpsons-api';
import { SearchBar } from "../../../shared/components/search-bar/search-bar";
import { Paginator } from '../../../shared/components/paginator/paginator';
import { Character } from '../../../core/interfaces/character.interface';
import { CharacterModal } from '../../../shared/components/character-modal/character-modal';

@Component({
  selector: 'app-characters-list',
  standalone: true,
  imports: [CharacterModal,CharacterCard, SearchBar, Paginator],
  templateUrl: './characters-list.html',
  styleUrl: './characters-list.scss'
})
export class CharactersList implements OnInit {

  // 4. CREA LA SIGNAL PARA EL ESTADO DEL MODAL
  characterSelected = signal<Character | null>(null);
  // Inyectamos el servicio que creamos
  apiService = inject(SimpsonsApiService);

  ngOnInit() {
    // Apenas cargue el componente, le pedimos a la API la página 1
    this.apiService.getCharacters(1);
  }

  // 5. FUNCIONES PARA ABRIR Y CERRAR
openModal(character: Character) {
    this.characterSelected.set(character); // <- Debe decir 'character' igual que arriba
  }

  closeModal() {
    this.characterSelected.set(null);
  }
}

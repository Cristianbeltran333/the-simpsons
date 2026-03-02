import { Component, inject, input, OnInit } from '@angular/core'; // Añadimos input y OnInit
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { SimpsonsApiService } from '../../../core/services/simpsons-api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
})
export class SearchBar implements OnInit { // Agregamos implements OnInit por buena práctica

  apiService = inject(SimpsonsApiService);

  // 👇 1. RECIBIMOS EL TEMA (Por defecto sigue siendo characters)
  theme = input<'characters' | 'locations' | 'episodes'>('characters');

  // Control reactivo del input
  searchControl = new FormControl('');

  // Estado para la animación y mostrar/ocultar el input
  isSearchOpen = false;

  ngOnInit() {
    // Escuchamos lo que el usuario escribe en tiempo real
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((query) => {

      // 👇 2. LA MAGIA: DECIDIMOS QUÉ BUSCAR SEGÚN EL TEMA
      const searchTerm = query || '';

     if (this.theme() === 'characters') {
        this.apiService.searchCharacters(searchTerm);
      } else if (this.theme() === 'locations') {
        this.apiService.searchLocations(searchTerm);
      } else if (this.theme() === 'episodes') {
        // 👇 Añadimos la ruta para los episodios
        this.apiService.searchEpisodes(searchTerm);
      }

    });
  }

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
  }

  clearSearch() {
    this.searchControl.setValue(''); // Esto dispara automáticamente la búsqueda vacía gracias al subscribe
    this.isSearchOpen = true; // Mantenemos la barra abierta
  }

}

import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { SimpsonsApiService } from '../../../core/services/simpsons-api';

@Component({
  selector: 'app-search-bar',
  imports: [ReactiveFormsModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
})
export class SearchBar {

  apiService = inject(SimpsonsApiService);

  // Control reactivo del input
  searchControl = new FormControl('');

  // Estado para la animación y mostrar/ocultar el input
  isSearchOpen = false;

  ngOnInit() {
    // Escuchamos lo que el usuario escribe en tiempo real
    this.searchControl.valueChanges.pipe(
      debounceTime(400), // Espera 400ms después de la última tecla
      distinctUntilChanged() // Solo busca si el texto realmente cambió
    ).subscribe((query) => {
      this.apiService.searchCharacters(query || '');
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

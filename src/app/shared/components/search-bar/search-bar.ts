import { Component, computed, inject, input, OnInit, ViewChild } from '@angular/core'; 
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { SimpsonsApiService } from '../../../core/services/simpsons-api';
import { CommonModule } from '@angular/common';
import { SearchFiltersComponent } from '../search-filters/search-filters.component';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, SearchFiltersComponent],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
})
export class SearchBar implements OnInit { 

  apiService = inject(SimpsonsApiService);

  theme = input<'characters' | 'locations' | 'episodes'>('characters');

  placeholderText = computed(() => {
    switch (this.theme()) {
      case 'locations':
        return 'Buscar por ID o nombre del lugar...';
      case 'episodes':
        return 'Buscar por ID o nombre del episodio...'; 
      case 'characters':
      default:
        return 'Buscar por ID o nombre del personaje...';
    }
  });

  searchControl = new FormControl('');
  isSearchOpen = false;
  
  // Estado para el Modal de Filtros
  isFiltersOpen = false;
  currentFilters: any = null;

  @ViewChild(SearchFiltersComponent) filtersComponent!: SearchFiltersComponent;

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.executeSearch(query || '');
    });
  }

  // Separamos la ejecución para poder reutilizarla al aplicar filtros
  executeSearch(searchTerm: string) {
    if (this.theme() === 'characters') {
      this.apiService.searchCharacters(searchTerm, this.currentFilters);
    } else if (this.theme() === 'locations') {
      this.apiService.searchLocations(searchTerm, this.currentFilters);
    } else if (this.theme() === 'episodes') {
      this.apiService.searchEpisodes(searchTerm, this.currentFilters);
    }
  }

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
  }

  clearSearch() {
    this.searchControl.setValue('', { emitEvent: false }); 
    if (this.filtersComponent) {
      this.filtersComponent.clearForm(); // Emitirá null a applyFilters y re-ejecutará executeSearch
    } else {
      this.currentFilters = null;
      this.executeSearch('');
    }
    this.isSearchOpen = true; 
  }

  // --- LÓGICA DE FILTROS ---
  openFilters() {
    this.isFiltersOpen = true;
  }

  closeFilters() {
    this.isFiltersOpen = false;
  }

  onFiltersApplied(filters: any) {
    this.currentFilters = filters;
    // Si queremos re-ejecutar la búsqueda con los filtros aplicados:
    this.executeSearch(this.searchControl.value || '');
  }

}

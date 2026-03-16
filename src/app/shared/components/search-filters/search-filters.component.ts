import { Component, EventEmitter, Output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-search-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-filters.component.html',
  styleUrl: './search-filters.component.scss',
})
export class SearchFiltersComponent {
  theme = input<'characters' | 'locations' | 'episodes'>('characters');
  isOpen = input<boolean>(false);

  @Output() close = new EventEmitter<void>();
  @Output() applyFilters = new EventEmitter<any>();

  charactersForm: FormGroup;
  episodesForm: FormGroup;
  locationsForm: FormGroup;

  get temporadas() { return Array.from({length: 35}, (_, i) => i + 1); }
  get anos() { return Array.from({length: 2024 - 1989 + 1}, (_, i) => 2024 - i); }
  get meses() { return Array.from({length: 12}, (_, i) => i + 1); }

  constructor(private fb: FormBuilder) {
    this.charactersForm = this.fb.group({
      estado: ['Todos'],
      genero: ['Cualquiera'],
      cumpleanos: ['No importa'],
      edad: ['Todas las Edades'],
      frases: ['Mostrar Todos']
    });

    this.episodesForm = this.fb.group({
      temporada: ['Todas las Temporadas'],
      minEp: [null],
      maxEp: [null],
      ano: ['Cualquier Año'],
      mes: ['Cualquier Mes']
    });

    this.locationsForm = this.fb.group({
      categoria: ['Todas las categorías'],
      locacion: ['Cualquiera']
    });
  }

  closeModal() {
    this.close.emit();
  }

  preventClose(event: Event) {
    event.stopPropagation();
  }

  clearForm() {
    if (this.theme() === 'characters') this.charactersForm.reset({ estado: 'Todos', genero: 'Cualquiera', cumpleanos: 'No importa', edad: 'Todas las Edades', frases: 'Mostrar Todos' });
    if (this.theme() === 'episodes') this.episodesForm.reset({ temporada: 'Todas las Temporadas', ano: 'Cualquier Año', mes: 'Cualquier Mes' });
    if (this.theme() === 'locations') this.locationsForm.reset({ categoria: 'Todas las categorías', locacion: 'Cualquiera' });
    
    this.applyFilters.emit(null);
  }

  submitFilters() {
    let filters = {};
    if (this.theme() === 'characters') filters = this.charactersForm.value;
    if (this.theme() === 'episodes') filters = this.episodesForm.value;
    if (this.theme() === 'locations') filters = this.locationsForm.value;

    this.applyFilters.emit(filters);
    this.closeModal();
  }
}

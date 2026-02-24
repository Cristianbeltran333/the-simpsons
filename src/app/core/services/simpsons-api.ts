import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { CharacterResponse } from '../interfaces/character.interface';

@Injectable({
  providedIn: 'root',
})
export class SimpsonsApiService {

  private http = inject(HttpClient);

  private baseUrl = 'https://thesimpsonsapi.com/api';

  charactersResponse = signal<CharacterResponse | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  isSearching = signal<boolean>(false)

  getCharacters(page: number = 1, search: string = '') {

    this.isLoading.set(true);
    this.error.set(null);

    let url = `${this.baseUrl}/characters?page=${page}`;
    if (search) {
      url += `&name=${search}`;
    }

    this.http.get<CharacterResponse>(url).subscribe({
      next: (response) => {
        this.charactersResponse.set(response);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error en la API:', err);
        this.error.set('¡D\'oh! No pudimos conectar con Springfield.');
        this.isLoading.set(false);
        this.charactersResponse.set(null);
      }
    });
  }

  searchCharacters(query: string) {
    const cleanQuery = query.trim();

    // Si el input está vacío, restauramos la página 1 y apagamos el modo búsqueda
    if (!cleanQuery) {
      this.isSearching.set(false);
      this.getCharacters(1);
      return;
    }

    this.isSearching.set(true);
    this.isLoading.set(true);
    this.error.set(null);

    // Detectamos si es un ID (solo números) o un Nombre (texto)
    const isId = /^\d+$/.test(cleanQuery);
    const url = isId
      ? `${this.baseUrl}/characters/${cleanQuery}`
      : `${this.baseUrl}/characters?name=${cleanQuery}`;

    this.http.get<any>(url).subscribe({
      next: (response) => {
        // Si buscamos por ID, la API suele devolver un solo objeto en lugar de un array.
        // Lo envolvemos en nuestra interfaz para que la vista no se rompa.
        if (isId && response.id) {
          this.charactersResponse.set({ info: null as any, results: [response] });
        } else {
          // Si no hay resultados, vaciamos el array
          this.charactersResponse.set(response.results ? response : { info: null as any, results: [] });
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error en búsqueda:', err);
        // Simulamos un array vacío para disparar la pantalla de "Sin resultados"
        this.charactersResponse.set({ info: null as any, results: [] });
        this.isLoading.set(false);
      }
    });

  }
}

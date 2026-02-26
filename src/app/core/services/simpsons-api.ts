import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { CharacterResponse } from '../interfaces/character.interface';

@Injectable({
  providedIn: 'root',
})
export class SimpsonsApiService {

  private http = inject(HttpClient);
  private baseUrl = 'https://thesimpsonsapi.com/api';

  // Signals de estado
  charactersResponse = signal<CharacterResponse | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Signals para el buscador
  isSearching = signal<boolean>(false);
  searchType = signal<'name' | 'id'>('name'); // <-- NUEVA: Para saber qué imagen mostrar al fallar

  // AÑADE ESTAS 3 SIGNALS PARA EL PAGINADOR
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalCount = signal<number>(0);



  // Función normal para el paginador
  getCharacters(page: number = 1, search: string = '') {
    this.isLoading.set(true);
    this.error.set(null);

    let url = `${this.baseUrl}/characters?page=${page}`;
    if (search) {
      url += `&name=${search}`;
    }

    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.charactersResponse.set(response);

        // LÓGICA ROBUSTA PARA LEER LAS PÁGINAS (Como en tu proyecto anterior)
        this.currentPage.set(page);

        // Si la API trae 'pages' lo usamos, si no, calculamos las páginas dividiendo el 'count' entre 20
        const calcPages = response.pages || (response.info && response.info.pages) || Math.max(1, Math.ceil((response.count || 0) / 20));
        this.totalPages.set(calcPages);

        const calcCount = response.count || (response.info && response.info.count) || (response.results?.length || 0);
        this.totalCount.set(calcCount);

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

  // Función inteligente para el buscador interactivo
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

    // Guardamos el tipo de búsqueda para la vista
    this.searchType.set(isId ? 'id' : 'name');

    const url = isId
      ? `${this.baseUrl}/characters/${cleanQuery}`
      : `${this.baseUrl}/characters?name=${cleanQuery}`;

    this.http.get<any>(url).subscribe({
      next: (response) => {
        // 1. Si buscamos por ID, la API devuelve un solo objeto
        if (isId && response.id) {
          this.charactersResponse.set({ info: null as any, results: [response] });
        }
        // 2. Si buscamos por Nombre, aplicamos el FILTRO ESTRICTO local
        else if (response.results) {
          const queryLower = cleanQuery.toLowerCase();

          const strictResults = response.results.filter((char: any) => {
            const nameLower = char.name.toLowerCase();
            const words = nameLower.split(' '); // Separamos el nombre en palabras

            // Lógica estricta: Coincidencia exacta o que alguna palabra empiece con las letras
            return nameLower.includes(queryLower) ||
                   words.some((word: string) => word.startsWith(queryLower));
          });

          // Actualizamos la Signal solo con los resultados precisos
          this.charactersResponse.set({ ...response, results: strictResults });
        }
        // 3. Si no trae ni ID ni results, está vacío
        else {
          this.charactersResponse.set({ info: null as any, results: [] });
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

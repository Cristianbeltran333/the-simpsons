import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { CharacterResponse } from '../interfaces/character.interface';
import { LocationsResponse, SimpsonLocation } from '../interfaces/location.interface';
import { EpisodesResponse } from '../interfaces/episode.interface';


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

  episodesResponse = signal<EpisodesResponse | null>(null);
  locationsResponse = signal<LocationsResponse | null>(null);

  // Signals para el buscador
  isSearching = signal<boolean>(false);
  searchType = signal<'name' | 'id'>('name'); // <-- NUEVA: Para saber qué imagen mostrar al fallar
  searchError = signal<'id' | 'name' | null>(null);

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

 // 3. AGREGA LA FUNCIÓN GET (CORREGIDA)
  getEpisodes(page: number = 1): void {
    // Activamos el loading para mantener la consistencia en la UI
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<EpisodesResponse>(`https://thesimpsonsapi.com/api/episodes?page=${page}`)
      .subscribe({
        next: (response) => {
          // 1. Guardamos la lista de episodios para pintar las tarjetas
          this.episodesResponse.set(response);

          // 👇 2. LA MAGIA COMPARTIDA PARA EL PAGINADOR 👇
          // Actualizamos la página en la que estamos parados
          this.currentPage.set(page);

          // Leemos el total de páginas directamente de la respuesta de la API
          this.totalPages.set(response.pages);

          // Leemos el total de episodios para mostrarlo en el texto inferior
          this.totalCount.set(response.count);
          // 👆 HASTA AQUÍ 👆

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('¡Ay Caramba! Error cargando episodios', error);
          this.error.set('No se pudieron cargar los episodios.');
          this.episodesResponse.set(null);
          this.isLoading.set(false);
        }
      });
  }

  getLocations(page: number = 1) {
    this.isLoading.set(true);

    this.http.get<LocationsResponse>(`${this.baseUrl}/locations?page=${page}`).subscribe({
      next: (response) => {
        this.locationsResponse.set(response);

        // 👇 LA MAGIA COMPARTIDA PARA EL PAGINADOR 👇
        this.currentPage.set(page);

        const calcPages = response.pages || Math.max(1, Math.ceil((response.count || 0) / 20));
        this.totalPages.set(calcPages);

        const calcCount = response.count || (response.results?.length || 0);
        this.totalCount.set(calcCount);
        // 👆 HASTA AQUÍ 👆

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando lugares:', err);
        this.locationsResponse.set(null);
        this.isLoading.set(false);
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

  // 👇 NUEVA FUNCIÓN PARA BUSCAR EPISODIOS
  searchEpisodes(name: string): void {
    // 1. Si el usuario borró todo, apagamos la búsqueda y cargamos la página 1
    if (!name.trim()) {
      this.isSearching.set(false);
      this.getEpisodes(1);
      return;
    }

    // 2. Si hay texto, activamos el estado de búsqueda (para ocultar el paginador)
    this.isSearching.set(true);

    // 3. Hacemos la petición a la API con el parámetro ?name=
    this.http.get<EpisodesResponse>(`https://thesimpsonsapi.com/api/episodes?name=${name}`)
      .subscribe({
        next: (response) => {
          // Guardamos los resultados en la señal de episodios
          this.episodesResponse.set(response);
        },
        error: (error) => {
          console.error('¡Ay Caramba! No se encontró el episodio', error);
          this.episodesResponse.set({ count: 0, pages: 0, next: null, prev: null, results: [] });

          // 👇 Reseteamos la paginación para que desaparezca el componente
          this.totalPages.set(0);
          this.totalCount.set(0);
        }
      });
  }


  searchLocations(query: string): void {
    if (!query.trim()) {
      this.searchError.set(null);
      this.getLocations(1);
      return;
    }

    this.isLoading.set(true);
    this.searchError.set(null); // Limpiamos errores previos

    const isId = !isNaN(Number(query));

    if (isId) {
      // 🟢 BÚSQUEDA POR ID
      this.http.get<SimpsonLocation>(`${this.baseUrl}/locations/${query}`)
        .subscribe({
          next: (location) => {
            this.locationsResponse.set({
              count: 1, pages: 1, next: null, prev: null, results: [location]
            });
            this.isLoading.set(false);
          },
          error: () => {
            // SOLUCIÓN 1: Si el ID falla (ej. 0 o 478), NO buscamos por nombre.
            // Vaciamos la vista y mostramos directamente a Homero Hulk.
            this.locationsResponse.set(null);
            this.searchError.set('id');
            this.isLoading.set(false);
          }
        });
    } else {
      // 🔵 BÚSQUEDA POR NOMBRE
      this.fetchLocationsByName(query);
    }
  }

  private fetchLocationsByName(query: string): void {
    this.http.get<LocationsResponse>(`${this.baseUrl}/locations?name=${query}`)
      .subscribe({
        next: (res) => {
          // SOLUCIÓN 2 y 3: Como la API es tramposa y siempre nos da 20 resultados
          // ignorando lo que buscamos, filtramos "a mano" las coincidencias reales.
          const coincidencias = res.results?.filter(loc =>
            loc.name.toLowerCase().includes(query.toLowerCase())
          ) || [];

          if (coincidencias.length > 0) {
            // Si el nombre sí coincide con alguno, lo mostramos
            this.locationsResponse.set({ ...res, results: coincidencias });
          } else {
            // Si la API nos mandó basura que no coincide, mostramos a Bart
            this.locationsResponse.set(null);
            this.searchError.set('name');
          }

          this.isLoading.set(false);
        },
        error: () => {
          this.locationsResponse.set(null);
          this.searchError.set('name');
          this.isLoading.set(false);
        }
      });
  }
}

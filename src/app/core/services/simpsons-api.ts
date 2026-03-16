import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { CharacterResponse } from '../interfaces/character.interface';
import { LocationsResponse, SimpsonLocation } from '../interfaces/location.interface';
import { EpisodesResponse, SimpsonEpisode } from '../interfaces/episode.interface';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';


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
  searchError = signal<'id' | 'name' | 'filters' | null>(null);

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
    this.isSearching.set(false); // Make sure paginator isn't hidden by old search states
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
          // Mantenemos al menos 1 página para que el paginador funcione
          this.totalPages.set(response.pages || Math.max(1, Math.ceil((response.count || 0) / 20)));

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
    this.isSearching.set(false); // Reset search state to avoid hiding paginator

    this.http.get<LocationsResponse>(`${this.baseUrl}/locations?page=${page}`).subscribe({
      next: (response) => {
        this.locationsResponse.set(response);

        // 👇 LA MAGIA COMPARTIDA PARA EL PAGINADOR 👇
        this.currentPage.set(page);

        // Using safe calculation to ensure totalPages is properly set
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


  // Función inteligente para el buscador interactivo (Bypass Paginación con Caché Global)
  private allCharactersCache: any[] | null = null;

  searchCharacters(query: string, filters?: any) {
    const cleanQuery = query.trim();
    const hasFilters = filters && Object.keys(filters).length > 0;

    if (!cleanQuery && !hasFilters) {
      this.isSearching.set(false);
      this.searchError.set(null);
      this.getCharacters(1);
      return;
    }

    this.isSearching.set(true);
    this.isLoading.set(true);
    this.error.set(null);
    this.searchError.set(null);

    const isId = /^\d+$/.test(cleanQuery) && cleanQuery !== '';
    this.searchType.set(isId ? 'id' : 'name');

    if (isId) {
      this.http.get<any>(`${this.baseUrl}/characters/${cleanQuery}`).subscribe({
        next: (response) => {
          if (response.id) {
            this.charactersResponse.set({ info: null as any, results: [response] });
            this.totalPages.set(0);
            this.totalCount.set(1);
          } else {
            this.charactersResponse.set({ info: null as any, results: [] });
            this.searchError.set('id');
            this.totalPages.set(0);
            this.totalCount.set(0);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          this.charactersResponse.set({ info: null as any, results: [] });
          this.searchError.set('id');
          this.totalPages.set(0);
          this.totalCount.set(0);
          this.isLoading.set(false);
        }
      });
    } else {
      // 🔵 BÚSQUEDA GLOBAL / FILTRADO AVANZADO
      if (this.allCharactersCache) {
        this.filterStoredCharacters(cleanQuery, this.allCharactersCache, filters);
      } else {
        this.http.get<any>(`${this.baseUrl}/characters?page=1`).pipe(
          switchMap(firstPage => {
            const totalPages = firstPage.pages || 60; // Conocemos que thesimpsonsapi usa ~60
            const requests: Observable<any>[] = [of(firstPage)];

            for (let i = 2; i <= totalPages; i++) {
              requests.push(this.http.get<any>(`${this.baseUrl}/characters?page=${i}`));
            }

            return forkJoin(requests);
          })
        ).subscribe({
          next: (responses) => {
            let all: any[] = [];
            responses.forEach(res => {
              if (res && res.results) {
                all = [...all, ...res.results];
              }
            });
            this.allCharactersCache = all;
            this.filterStoredCharacters(cleanQuery, all, filters);
          },
          error: () => {
            this.charactersResponse.set({ info: null as any, results: [] });
            this.searchError.set(filters && Object.keys(filters).length > 0 ? 'filters' : 'name');
            this.isLoading.set(false);
          }
        });
      }
    }
  }

  // Filtrado Estricto Local para Personajes
  private filterStoredCharacters(query: string, catalog: any[], filters?: any) {
    const queryLower = query.toLowerCase();

    const strictResults = catalog.filter((char) => {
      // 1. Filtro de Texto (Nombre)
      let matchesText = true;
      if (queryLower) {
        const nameLower = char.name.toLowerCase();
        const words = nameLower.split(' ');
        matchesText = nameLower.includes(queryLower) || words.some((word: string) => word.startsWith(queryLower));
      }
      if (!matchesText) return false;

      // 2. Filtros Avanzados (si existen)
      if (filters) {
        // Estado
        if (filters.estado === 'Vivos' && char.status !== 'Alive') return false;
        if (filters.estado === 'Muertos' && char.status !== 'Deceased') return false;

        // Género
        if (filters.genero === 'Masculino' && char.gender !== 'Male') return false;
        if (filters.genero === 'Femenino' && char.gender !== 'Female') return false;
        if (filters.genero === 'Desconocido' && (char.gender === 'Male' || char.gender === 'Female')) return false;

        // Cumpleaños
        if (filters.cumpleanos === 'Con fecha' && (!char.birthdate || char.birthdate === 'Unknown')) return false;
        if (filters.cumpleanos === 'Sin fecha' && char.birthdate && char.birthdate !== 'Unknown') return false;

        // Edad (Parsing matemático)
        if (filters.edad !== 'Todas las Edades') {
          const ageStr = char.age ? String(char.age).replace(/\D/g, '') : '';
          const age = parseInt(ageStr, 10);
          
          if (filters.edad === 'Desconocida' && !isNaN(age)) return false;
          
          if (!isNaN(age)) {
             if (filters.edad === 'Niños' && (age < 0 || age > 12)) return false;
             if (filters.edad === 'Adolescentes' && (age < 13 || age > 19)) return false;
             if (filters.edad === 'Adultos' && (age < 20 || age > 59)) return false;
             if (filters.edad === 'Tercera Edad' && (age < 60 || age > 99)) return false;
             if (filters.edad === 'Inmortales' && age < 100) return false;
          } else if (filters.edad !== 'Desconocida') {
             // Si piden un rango exacto pero el pj no tiene edad válida
             return false;
          }
        }

        // Frases Célebres
        const hasPhrases = char.phrases && char.phrases.length > 0;
        if (filters.frases === 'Solo con Frases' && !hasPhrases) return false;
        if (filters.frases === 'Sin Frases' && hasPhrases) return false;
      }

      return true;
    });

    if (strictResults.length > 0) {
      this.charactersResponse.set({
        info: null as any,
        results: strictResults
      });
      this.totalPages.set(1);
      this.totalCount.set(strictResults.length);
      this.searchError.set(null);
    } else {
      this.charactersResponse.set({ info: null as any, results: [] });
      this.searchError.set(filters && Object.keys(filters).length > 0 ? 'filters' : 'name');
      this.totalPages.set(0);
      this.totalCount.set(0);
    }
    this.isLoading.set(false);
  }

  // 👇 NUEVA FUNCIÓN PARA BUSCAR EPISODIOS CON CACHÉ GLOBAL
  private allEpisodesCache: SimpsonEpisode[] | null = null;

  searchEpisodes(query: string, filters?: any): void {
    const cleanQuery = query.trim();
    const hasFilters = filters && Object.keys(filters).length > 0;

    // 1. Si no hay búsqueda ni filtros
    if (!cleanQuery && !hasFilters) {
      this.isSearching.set(false);
      this.searchError.set(null);
      this.getEpisodes(1);
      return;
    }

    // 2. Si hay texto o filtros, activamos estado de búsqueda global
    this.isSearching.set(true);
    this.isLoading.set(true);
    this.searchError.set(null); 
    this.error.set(null);

    const isId = !isNaN(Number(cleanQuery)) && cleanQuery !== '';

    if (isId) {
      // 🟢 BÚSQUEDA POR NUMERACIÓN/ID
      this.searchType.set('id');
      this.http.get<SimpsonEpisode>(`${this.baseUrl}/episodes/${cleanQuery}`)
        .subscribe({
          next: (episode) => {
            this.episodesResponse.set({
              count: 1, pages: 1, next: null, prev: null, results: [episode]
            });
            this.totalPages.set(0);
            this.totalCount.set(1);
            this.isLoading.set(false);
          },
          error: () => {
            this.episodesResponse.set(null);
            this.searchError.set('id');
            this.totalPages.set(0);
            this.totalCount.set(0);
            this.isLoading.set(false);
          }
        });
    } else {
      // 🔵 BÚSQUEDA ESTRUCTURAL / FILTROS (Extracción Global)
      this.searchType.set('name');

      if (this.allEpisodesCache) {
        // Ya descargamos todo antes, filtramos rapidísimo
        this.filterStoredEpisodes(cleanQuery, this.allEpisodesCache, filters);
      } else {
        // Pedimos la página 1 para ver el Total de Páginas (sabemos que son ~39)
        this.http.get<EpisodesResponse>(`${this.baseUrl}/episodes?page=1`).pipe(
          switchMap(firstPage => {
            const totalPages = firstPage.pages || 39;
            const requests: Observable<EpisodesResponse>[] = [of(firstPage)];

            // Creamos las promesas del resto de las páginas
            for (let i = 2; i <= totalPages; i++) {
              requests.push(this.http.get<EpisodesResponse>(`${this.baseUrl}/episodes?page=${i}`));
            }

            // Descargamos todas las páginas concurrentemente
            return forkJoin(requests);
          })
        ).subscribe({
          next: (responses) => {
            let all: SimpsonEpisode[] = [];
            responses.forEach(res => {
              if (res && res.results) {
                all = [...all, ...res.results];
              }
            });
            // Guardamos el catálogo completo en RAM
            this.allEpisodesCache = all;
            this.filterStoredEpisodes(cleanQuery, all, filters);
          },
          error: () => {
            this.episodesResponse.set(null);
            this.searchError.set(filters && Object.keys(filters).length > 0 ? 'filters' : 'name');
            this.totalPages.set(0);
            this.totalCount.set(0);
            this.isLoading.set(false);
          }
        });
      }
    }
  }

  // Filtrado Estricto de Episodios en Memoria
  private filterStoredEpisodes(query: string, catalog: SimpsonEpisode[], filters?: any) {
    const queryLower = query.toLowerCase();
    
    // Filtro multicapa
    const coincidencias = catalog.filter((epi) => {
      // 1. Texto (Nombre)
      let matchesText = true;
      if (queryLower) {
        const nameLower = epi.name.toLowerCase();
        matchesText = nameLower.includes(queryLower);
      }
      if (!matchesText) return false;

      // 2. Filtros Avanzados
      if (filters) {
        // Temporada
        if (filters.temporada !== 'Todas las Temporadas') {
          if (epi.season !== Number(filters.temporada)) return false;
        }

        // Rango de Episodios
        const epNum = epi.episode_number;
        if (filters.minEp && epNum < Number(filters.minEp)) return false;
        if (filters.maxEp && epNum > Number(filters.maxEp)) return false;

        // Año y Mes (Parse string "YYYY-MM-DD")
        if (epi.airdate) {
          const [yearStr, monthStr] = epi.airdate.split('-');
          const eYear = parseInt(yearStr, 10);
          const eMonth = parseInt(monthStr, 10);

          if (filters.ano !== 'Cualquier Año' && eYear !== Number(filters.ano)) return false;
          if (filters.mes !== 'Cualquier Mes' && eMonth !== Number(filters.mes)) return false;
        } else {
          // Si pedimos fecha estricta y el api no trae date
          if (filters.ano !== 'Cualquier Año' || filters.mes !== 'Cualquier Mes') return false;
        }
      }

      return true;
    });

    if (coincidencias.length > 0) {
      this.episodesResponse.set({
        count: coincidencias.length,
        pages: 1,
        next: null,
        prev: null,
        results: coincidencias
      });
      this.totalPages.set(1);
      this.totalCount.set(coincidencias.length);
    } else {
      this.episodesResponse.set(null);
      this.searchError.set(filters && Object.keys(filters).length > 0 ? 'filters' : 'name');
      this.totalPages.set(0);
      this.totalCount.set(0);
    }
    this.isLoading.set(false);
  }


  // Búsqueda Global de Lugares
  private allLocationsCache: SimpsonLocation[] | null = null;

  searchLocations(query: string, filters?: any): void {
    const cleanQuery = query.trim();
    const hasFilters = filters && Object.keys(filters).length > 0;

    if (!cleanQuery && !hasFilters) {
      this.isSearching.set(false);
      this.searchError.set(null);
      this.getLocations(1);
      return;
    }

    this.isSearching.set(true); 
    this.isLoading.set(true);
    this.searchError.set(null); 
    this.error.set(null);

    const isId = !isNaN(Number(cleanQuery)) && cleanQuery !== '';

    if (isId) {
      // 🟢 BÚSQUEDA POR ID
      this.http.get<SimpsonLocation>(`${this.baseUrl}/locations/${cleanQuery}`)
        .subscribe({
          next: (location) => {
            this.locationsResponse.set({
              count: 1, pages: 1, next: null, prev: null, results: [location]
            });
            this.totalPages.set(0);
            this.totalCount.set(1);
            this.isLoading.set(false);
          },
          error: () => {
            this.locationsResponse.set(null);
            this.searchError.set('id');
            this.isLoading.set(false);
          }
        });
    } else {
      // 🔵 BÚSQUEDA GLOBAL / FILTRADO (Extracción Global RxJS)
      if (this.allLocationsCache) {
        this.filterStoredLocations(cleanQuery, this.allLocationsCache, filters);
      } else {
        this.http.get<LocationsResponse>(`${this.baseUrl}/locations?page=1`).pipe(
          switchMap(firstPage => {
            const totalPages = firstPage.pages || 24; 
            const requests: Observable<LocationsResponse>[] = [of(firstPage)];

            for (let i = 2; i <= totalPages; i++) {
              requests.push(this.http.get<LocationsResponse>(`${this.baseUrl}/locations?page=${i}`));
            }

            return forkJoin(requests);
          })
        ).subscribe({
          next: (responses) => {
            let all: SimpsonLocation[] = [];
            responses.forEach(res => {
              if (res && res.results) {
                all = [...all, ...res.results];
              }
            });
            this.allLocationsCache = all;
            this.filterStoredLocations(cleanQuery, all, filters);
          },
          error: () => {
            this.locationsResponse.set(null);
            this.searchError.set(filters && Object.keys(filters).length > 0 ? 'filters' : 'name');
            this.totalPages.set(0);
            this.totalCount.set(0);
            this.isLoading.set(false);
          }
        });
      }
    }
  }

  // Filtro Estricto Local para Lugares
  private filterStoredLocations(query: string, catalog: SimpsonLocation[], filters?: any) {
    const queryLower = query.toLowerCase();

    const coincidencias = catalog.filter((loc) => {
      let matchesText = true;
      if (queryLower) {
        const nameLower = loc.name.toLowerCase();
        matchesText = nameLower.includes(queryLower);
      }
      if (!matchesText) return false;

      // Filtros Avanzados
      if (filters) {
        // Categoría (Residencial, Shop, Hospital, etc)
        // Como la API es un poco inconsistente con el tipo "use", cruzamos también con el nombre
        if (filters.categoria !== 'Todas las categorías') {
          const categoryLower = filters.categoria.toLowerCase();
          const useOrName = `${loc.use || ''} ${loc.name || ''}`.toLowerCase();
          if (!useOrName.includes(categoryLower)) return false;
        }

        // Locación
        if (filters.locacion !== 'Cualquiera') {
          const isSpringfield = loc.town && loc.town.toLowerCase().includes('springfield');
          
          if (filters.locacion === 'En Springfield' && !isSpringfield) return false;
          if (filters.locacion === 'Fuera de Springfield' && isSpringfield) return false;
        }
      }

      return true;
    });

    if (coincidencias.length > 0) {
      this.locationsResponse.set({
        count: coincidencias.length,
        pages: 1,
        next: null,
        prev: null,
        results: coincidencias
      });
      this.totalPages.set(1);
      this.totalCount.set(coincidencias.length);
      this.searchError.set(null);
    } else {
      this.locationsResponse.set(null);
      this.searchError.set(filters && Object.keys(filters).length > 0 ? 'filters' : 'name');
      this.totalPages.set(0);
      this.totalCount.set(0);
    }
    this.isLoading.set(false);
  }
}

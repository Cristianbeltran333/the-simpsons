export interface SimpsonEpisode {
  id: number;
  name: string;
  airdate: string;
  episode_number: number;
  season: number;
  image_path: string;
  synopsis: string;
}

// La interfaz para la respuesta completa de la API (con la paginación)
export interface EpisodesResponse {
  count: number;
  next: string | null;
  prev: string | null;
  pages: number;
  results: SimpsonEpisode[];
}

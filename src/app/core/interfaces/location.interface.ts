export interface SimpsonLocation {
  id: number;
  name: string;
  image_path: string;
  town: string;
  use: string;
}

export interface LocationsResponse {
  count: number;
  next: string | null;
  prev: string | null;
  pages: number;
  results: SimpsonLocation[];
}

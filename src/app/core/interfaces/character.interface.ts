export interface Character {
  id: number;
  name: string;
  age: number | string;
  birthdate: string;
  gender: string;
  occupation: string;
  status: string;
  portrait_path: string;
  phrases: string[];
}

export interface PaginationInfo {
  count: number;
  pages: number;
  next: string | null;
  prev: string | null;
}

export interface CharacterResponse {
  info: PaginationInfo;
  results: Character[];
}

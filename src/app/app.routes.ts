import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: 'home',
    loadComponent: () => import('./features/home/home').then(m => m.Home),
    title: 'Inicio | The Simpsons API'
  },

  {
    path: 'characters',
    loadComponent: () => import('./features/characters/characters-list/characters-list').then(m => m.CharactersList),
    title: 'Personajes | The Simpsons API'
  },
  {
    path: 'episodes',
    loadComponent: () => import('./features/episodes/episodes-list/episodes-list').then(m => m.EpisodesList),
    title: 'Episodios | The Simpsons API'
  },
  {
    path: 'locations',
    loadComponent: () => import('./features/locations/locations-list/locations-list').then(m => m.LocationsList),
    title: 'Ubicaciones | The Simpsons API'
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];

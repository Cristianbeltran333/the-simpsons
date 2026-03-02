import { SearchBar } from './../../../shared/components/search-bar/search-bar';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationCard } from '../../../shared/components/location-card/location-card';
import { SimpsonsApiService } from '../../../core/services/simpsons-api';
import { Paginator } from '../../../shared/components/paginator/paginator';
// Importamos el servicio y la tarjeta (ajusta las rutas según tus carpetas)


@Component({
  selector: 'app-locations-list',
  standalone: true,
  imports: [CommonModule, LocationCard, SearchBar, Paginator],
  templateUrl: './locations-list.html',
  styleUrl: './locations-list.scss'
})
export class LocationsList implements OnInit {

  constructor(public apiService: SimpsonsApiService) {}

  ngOnInit() {
    // Simplemente pedimos la página 1 al arrancar, el paginador hará el resto
    this.apiService.getLocations(1);
  }

}

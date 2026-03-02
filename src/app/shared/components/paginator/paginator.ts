import { Component, inject, computed, input } from '@angular/core';
import { SimpsonsApiService } from '../../../core/services/simpsons-api';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paginator.html',
  styleUrl: './paginator.scss'
})
export class Paginator {
  apiService = inject(SimpsonsApiService);

  // 👇 1. RECIBIMOS EL TEMA (Por defecto 'characters')
  theme = input<'characters' | 'locations' | 'episodes'>('characters');

  // Leemos las signals del servicio
  currentPage = this.apiService.currentPage;
  totalPages = this.apiService.totalPages;
  totalCount = this.apiService.totalCount;

  // Lógica inteligente para construir el arreglo de páginas [1, 2, '...', 10]
  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }

    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, '...', current - 1, current, current + 1, '...', total];
  });

  goToPage(page: number | string) {
    // Si hacemos clic en los puntos suspensivos o en la página actual, no hacemos nada
    if (typeof page === 'string' || page === this.currentPage() || page < 1 || page > this.totalPages()) return;

   // 👇 2. LA MAGIA: DECIDIMOS QUÉ BUSCAR SEGÚN EL TEMA
    if (this.theme() === 'characters') {
      this.apiService.getCharacters(page);
    } else if (this.theme() === 'locations') {
      this.apiService.getLocations(page);
    } else if (this.theme() === 'episodes') {
      // 👇 Aquí llamamos a la nueva función de tu servicio
      this.apiService.getEpisodes(page);
    }

    // Opcional: Subimos el scroll suavemente al cambiar de página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

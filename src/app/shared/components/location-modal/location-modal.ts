import { Component, input, output } from '@angular/core';
import { SimpsonLocation } from '../../../core/interfaces/location.interface';



@Component({
  selector: 'app-location-modal',
  standalone: true,
  imports: [],
  templateUrl: './location-modal.html',
  styleUrl: './location-modal.scss'
})
export class LocationModal {

  // 1. Recibimos la información de la postal seleccionada
  location = input.required<SimpsonLocation>();

  // 2. Creamos el emisor para avisarle al padre que queremos cerrar el modal
  closeModal = output<void>();

  // 3. Función que se ejecutará al hacer clic en el botón amarillo con la "X"
  onClose(): void {
    this.closeModal.emit();
  }

}

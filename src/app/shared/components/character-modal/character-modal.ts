import { Component, input, output, computed, signal, effect, HostListener, Inject, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';

import { Character } from '../../../core/interfaces/character.interface';

@Component({
  selector: 'app-character-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-modal.html',
  styleUrl: './character-modal.scss'
})
export class CharacterModal implements OnDestroy {
  // Recibimos el personaje seleccionado desde el componente padre
  character = input<Character | null>(null);

  // Evento para avisarle al padre que el usuario cerró el modal
  closeModal = output<void>();

  // Estado interno del carrusel
  currentPhrasePage = signal(0);

  // Computado: Divide las frases en páginas (arreglos de 4 en 4)
  phrasePages = computed(() => {
    const phrases = this.character()?.phrases || [];
    const pages = [];
    const chunkSize = 4;
    for (let i = 0; i < phrases.length; i += chunkSize) {
      pages.push(phrases.slice(i, i + chunkSize));
    }
    return pages;
  });

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    // Efecto secundario: Reacciona cada vez que el personaje cambia
    effect(() => {
      const char = this.character();
      if (char) {
        // Bloquea el scroll de la página de fondo
        this.renderer.setStyle(this.document.body, 'overflow', 'hidden');
        // Reinicia el carrusel a la página 0 si abrimos un personaje nuevo
        this.currentPhrasePage.set(0);
      } else {
        // Desbloquea el scroll cuando se cierra
        this.renderer.removeStyle(this.document.body, 'overflow');
      }
    });
  }

  // Permite cerrar el modal presionando la tecla Escape
  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.character()) {
      this.onClose();
    }
  }

  onClose() {
    this.closeModal.emit();
  }

  // Navegación del Carrusel
  nextPhrase() {
    const total = this.phrasePages().length;
    if (total > 0) {
      this.currentPhrasePage.update(prev => (prev + 1) % total);
    }
  }

  prevPhrase() {
    const total = this.phrasePages().length;
    if (total > 0) {
      this.currentPhrasePage.update(prev => (prev - 1 + total) % total);
    }
  }

  ngOnDestroy() {
    // Seguro de vida: Siempre restaurar el scroll si el componente se destruye
    this.renderer.removeStyle(this.document.body, 'overflow');
  }
}

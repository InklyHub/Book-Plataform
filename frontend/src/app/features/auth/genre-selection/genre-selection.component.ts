import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

const GENRES = [
  { value: 'Romance',    label: 'Romance' },
  { value: 'Fantasy',    label: 'Fantasía' },
  { value: 'Sci-Fi',     label: 'Ciencia Ficción' },
  { value: 'Drama',      label: 'Drama' },
  { value: 'Horror',     label: 'Terror' },
  { value: 'Thriller',   label: 'Thriller' },
  { value: 'Mystery',    label: 'Misterio' },
  { value: 'Technical',  label: 'Técnico' },
  { value: 'Adventure',  label: 'Aventura' },
  { value: 'Historical', label: 'Histórico' },
];

@Component({
  selector: 'app-genre-selection',
  standalone: true,
  imports: [SpinnerComponent],
  template: `
    <div class="min-h-screen flex">

      <!-- Panel izquierdo — editorial (solo desktop) -->
      <div class="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
           style="background-color: #1A1410;" aria-hidden="true">

        <!-- Radial gradient overlay -->
        <div class="absolute inset-0 pointer-events-none"
             style="background: radial-gradient(ellipse at 20% 50%, rgba(196,107,30,0.18) 0%, transparent 65%);"></div>

        <!-- Logo -->
        <div class="relative flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-md flex items-center justify-center" style="background-color: #C46B1E;">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span class="font-bold text-white text-lg tracking-tight"
                style="font-family: 'Playfair Display', Georgia, serif;">Inkly</span>
        </div>

        <div class="relative space-y-5">
          <p class="text-xs font-bold uppercase tracking-widest" style="color: #C46B1E;">Paso 2 de 2</p>
          <div class="w-10 h-0.5" style="background-color: #C46B1E;"></div>
          <h2 class="text-[26px] font-bold leading-snug tracking-tight"
              style="color: #FAF6F0; font-family: 'Playfair Display', Georgia, serif;">
            Personaliza tu experiencia lectora
          </h2>
          <p class="text-sm leading-relaxed" style="color: #8C7B70;">
            Cuéntanos qué tipos de historias te apasionan. Usaremos tus preferencias para mostrarte contenido que te encantará.
          </p>
        </div>

        <p class="relative text-xs" style="color: #5C4E44;">
          Siempre podrás cambiar tus preferencias desde tu perfil.
        </p>
      </div>

      <!-- Panel de selección -->
      <div class="flex-1 flex items-center justify-center p-6 sm:p-10"
           style="background-color: #FAF6F0;">
        <div class="w-full max-w-lg animate-fade-in">

          <!-- Logo móvil -->
          <div class="lg:hidden flex items-center gap-2.5 mb-8">
            <div class="w-8 h-8 rounded-md flex items-center justify-center" style="background-color: #1A1410;">
              <svg class="w-4 h-4" style="color: #C46B1E;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span class="font-bold text-base tracking-tight"
                  style="color: #1A1410; font-family: 'Playfair Display', Georgia, serif;">Inkly</span>
          </div>

          <div class="mb-7">
            <h1 class="text-3xl font-bold tracking-tight"
                style="color: #1A1410; font-family: 'Playfair Display', Georgia, serif;">
              ¿Qué te gusta leer?
            </h1>
            <p class="text-sm mt-1.5" style="color: #5C4E44;">
              Elige uno o más géneros para personalizar tu experiencia
            </p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-7"
               role="group" aria-label="Selección de géneros">
            @for (genre of genres; track genre.value) {
              <button type="button"
                (click)="toggle(genre.value)"
                [attr.aria-pressed]="selected().includes(genre.value)"
                class="relative flex items-center justify-between gap-2 px-4 py-3 rounded-md border-2 text-left transition-all duration-150"
                [style.border-color]="selected().includes(genre.value) ? '#C46B1E' : '#DDD6D1'"
                [style.background-color]="selected().includes(genre.value) ? '#FAE8D5' : '#FFFFFF'">
                <span class="text-sm font-medium"
                      [style.color]="selected().includes(genre.value) ? '#C46B1E' : '#5C4E44'">
                  {{ genre.label }}
                </span>
                @if (selected().includes(genre.value)) {
                  <div class="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                       style="background-color: #C46B1E;">
                    <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                }
              </button>
            }
          </div>

          <div class="flex items-center justify-between">
            <p class="text-sm" style="color: #8C7B70;">
              @if (selected().length > 0) {
                {{ selected().length }} {{ selected().length === 1 ? 'seleccionado' : 'seleccionados' }}
              } @else {
                Ninguno seleccionado
              }
            </p>
            <button
              class="btn-primary"
              [disabled]="selected().length === 0 || loading()"
              (click)="save()">
              @if (loading()) { <app-spinner size="sm" /> } @else { Continuar }
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class GenreSelectionComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly genres = GENRES;
  readonly selected = signal<string[]>([]);
  readonly loading = signal(false);

  toggle(genre: string): void {
    this.selected.update(s =>
      s.includes(genre) ? s.filter(g => g !== genre) : [...s, genre]
    );
  }

  save(): void {
    if (this.selected().length === 0) return;
    this.loading.set(true);
    this.auth.saveOnboardingGenres(this.selected()).subscribe({
      next: () => this.router.navigate(['/home']),
      error: () => { this.loading.set(false); },
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

const GENRES = [
  { value: 'Romance',    icon: '💕', color: 'pink' },
  { value: 'Fantasy',    icon: '🧙', color: 'purple' },
  { value: 'Sci-Fi',     icon: '🚀', color: 'blue' },
  { value: 'Drama',      icon: '🎭', color: 'indigo' },
  { value: 'Horror',     icon: '👻', color: 'gray' },
  { value: 'Thriller',   icon: '🔪', color: 'red' },
  { value: 'Mystery',    icon: '🔍', color: 'yellow' },
  { value: 'Technical',  icon: '💻', color: 'green' },
  { value: 'Adventure',  icon: '⚔️', color: 'orange' },
  { value: 'Historical', icon: '🏛️', color: 'amber' },
];

@Component({
  selector: 'app-genre-selection',
  standalone: true,
  imports: [SpinnerComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div class="w-full max-w-2xl animate-fade-in">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">¿Qué te gusta leer?</h1>
          <p class="text-gray-500 mt-2">Elige al menos 1 género para personalizar tu experiencia</p>
        </div>

        <div class="card p-6">
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
            @for (genre of genres; track genre.value) {
              <button type="button"
                (click)="toggle(genre.value)"
                [class]="'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ' +
                         (selected().includes(genre.value)
                           ? 'border-purple-500 bg-purple-50 shadow-sm scale-105'
                           : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50')">
                <span class="text-2xl">{{ genre.icon }}</span>
                <span class="text-xs font-medium text-gray-700">{{ genre.value }}</span>
                @if (selected().includes(genre.value)) {
                  <span class="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                }
              </button>
            }
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-gray-100">
            <p class="text-sm text-gray-500">{{ selected().length }} seleccionados</p>
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

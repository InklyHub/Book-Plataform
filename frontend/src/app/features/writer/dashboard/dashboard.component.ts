import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { BookService } from '../../../core/services/book.service';
import { Book } from '../../../core/models';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, SpinnerComponent],
  template: `
    <div class="p-4 sm:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1>Mis libros</h1>
        <a routerLink="/writer/new" class="btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo libro
        </a>
      </div>

      <!-- Stats rápidas -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        @for (stat of stats(); track stat.label) {
          <div class="bg-white rounded-xl border border-ink-10 p-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                 style="background-color: rgba(196,107,30,0.10);">
              <svg class="w-4 h-4" style="color: #C46B1E;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="stat.iconPath" />
              </svg>
            </div>
            <p class="text-2xl font-bold text-ink tabular-nums">{{ stat.value }}</p>
            <p class="text-xs text-ink-40 mt-0.5">{{ stat.label }}</p>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20" aria-label="Cargando libros" aria-live="polite">
          <app-spinner size="lg" />
        </div>
      } @else if (books().length === 0) {
        <div class="text-center py-20 bg-white rounded-xl border border-ink-10">
          <div class="w-14 h-14 rounded-xl bg-ink-5 flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7 text-ink-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h2 class="text-lg font-bold text-ink mb-1">Aún no tienes libros</h2>
          <p class="text-ink-40 text-sm mb-5">Empieza a escribir tu primera historia</p>
          <a routerLink="/writer/new" class="btn-primary">Crear primer libro</a>
        </div>
      } @else {
        <div class="space-y-2">
          @for (book of books(); track book.id) {
            <article class="bg-white rounded-xl border border-ink-10 p-4 flex items-center gap-4
                            hover:border-ink-20 transition-colors duration-150">
              <!-- Portada -->
              <div class="w-12 rounded-lg overflow-hidden bg-ink-5 flex-shrink-0" style="height: 68px;">
                @if (book.cover_url) {
                  <img [src]="book.cover_url" [alt]="book.title + ' — portada'"
                       class="w-full h-full object-cover" loading="lazy" />
                } @else {
                  <div class="w-full h-full flex items-center justify-center">
                    <svg class="w-5 h-5 text-ink-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                }
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <h3 class="font-semibold text-ink truncate text-sm">{{ book.title }}</h3>
                  <span [class]="statusBadgeClass(book.status)" role="status">{{ statusLabel(book.status) }}</span>
                </div>
                <p class="text-xs text-ink-40">{{ book.genre }} · {{ book.chapters_count }} capítulos</p>
                <div class="flex items-center gap-4 text-xs text-ink-40 mt-1">
                  <span class="flex items-center gap-1">
                    <svg class="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    {{ book.rating_avg | number:'1.1-1' }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    {{ book.views_count | number }}
                  </span>
                  @if (book.is_monetized) {
                    <span class="font-medium" style="color: #C46B1E;">Monetizado</span>
                  }
                </div>
              </div>

              <!-- Acciones -->
              <div class="flex gap-1.5 flex-shrink-0">
                <a [routerLink]="['/writer/edit', book.id]"
                   class="btn-secondary text-xs px-3 py-2"
                   [attr.aria-label]="'Editar ' + book.title">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span class="hidden sm:inline">Editar</span>
                </a>
                <a [routerLink]="['/writer/analytics', book.id]"
                   class="btn-ghost text-sm p-2"
                   [attr.aria-label]="'Analytics de ' + book.title">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </a>
                <a [routerLink]="['/writer/monetize', book.id]"
                   class="btn-ghost text-sm p-2"
                   [attr.aria-label]="'Monetización de ' + book.title">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </a>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly bookService = inject(BookService);

  readonly books = signal<Book[]>([]);
  readonly loading = signal(true);
  readonly stats = signal<{ iconPath: string; value: number | string; label: string }[]>([]);

  ngOnInit(): void {
    this.bookService.getMyBooks().subscribe({
      next: books => {
        this.books.set(books);
        this.loading.set(false);
        this.stats.set([
          {
            iconPath: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
            value: books.length, label: 'Total libros',
          },
          {
            iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            value: books.filter(b => b.status === 'published').length, label: 'Publicados',
          },
          {
            iconPath: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
            value: books.reduce((s, b) => s + b.views_count, 0), label: 'Vistas totales',
          },
          {
            iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
            value: books.length ? (books.reduce((s, b) => s + b.rating_avg, 0) / books.length).toFixed(1) : '0',
            label: 'Rating promedio',
          },
        ]);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(s: string): string {
    return { draft: 'Borrador', published: 'Publicado', completed: 'Completado' }[s] ?? s;
  }

  statusBadgeClass(s: string): string {
    return {
      draft:     'badge-ink',
      published: 'badge-amber',
      completed: 'badge-blue',
    }[s] ?? 'badge';
  }
}

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
    <div class="p-3 sm:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Mis Libros</h1>
        <a routerLink="/writer/new" class="btn-primary">
          ✏️ Nuevo libro
        </a>
      </div>

      <!-- Stats rápidas -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        @for (stat of stats(); track stat.label) {
          <div class="card p-4 text-center">
            <p class="text-3xl mb-1">{{ stat.icon }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ stat.label }}</p>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20"><app-spinner size="lg" /></div>
      } @else if (books().length === 0) {
        <div class="text-center py-20 card">
          <p class="text-6xl mb-4">✍️</p>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Aún no tienes libros</h2>
          <p class="text-gray-500 mb-6">Empieza a escribir tu primera historia</p>
          <a routerLink="/writer/new" class="btn-primary">Crear primer libro</a>
        </div>
      } @else {
        <div class="space-y-3">
          @for (book of books(); track book.id) {
            <div class="card p-4 flex items-center gap-4 hover:shadow-md transition-all">
              <!-- Portada -->
              <div class="w-14 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 flex-shrink-0">
                @if (book.cover_url) {
                  <img [src]="book.cover_url" [alt]="book.title" class="w-full h-full object-cover" />
                } @else {
                  <div class="w-full h-full flex items-center justify-center text-2xl">📖</div>
                }
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-semibold text-gray-900 truncate">{{ book.title }}</h3>
                  <span [class]="statusBadgeClass(book.status)">{{ statusLabel(book.status) }}</span>
                </div>
                <p class="text-sm text-gray-500">{{ book.genre }} · {{ book.chapters_count }} capítulos</p>
                <div class="flex items-center gap-2 sm:gap-4 text-xs text-gray-400 mt-1">
                  <span>⭐ {{ book.rating_avg | number:'1.1-1' }}</span>
                  <span>👁️ {{ book.views_count | number }}</span>
                  @if (book.is_monetized) { <span class="text-yellow-600">💰 Monetizado</span> }
                </div>
              </div>

              <!-- Acciones -->
              <div class="flex gap-1.5 sm:gap-2 flex-shrink-0">
                <a [routerLink]="['/writer/edit', book.id]" class="btn-secondary text-xs sm:text-sm px-2 sm:px-3">
                  <span class="hidden sm:inline">Editar</span><span class="sm:hidden">✏️</span>
                </a>
                <a [routerLink]="['/writer/analytics', book.id]" class="btn-ghost text-sm">📊</a>
                <a [routerLink]="['/writer/monetize', book.id]" class="btn-ghost text-sm">💰</a>
              </div>
            </div>
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
  readonly stats = signal<{ icon: string; value: number | string; label: string }[]>([]);

  ngOnInit(): void {
    this.bookService.getMyBooks().subscribe({
      next: books => {
        this.books.set(books);
        this.loading.set(false);
        this.stats.set([
          { icon: '📚', value: books.length, label: 'Total libros' },
          { icon: '🌍', value: books.filter(b => b.status === 'published').length, label: 'Publicados' },
          { icon: '👁️', value: books.reduce((s, b) => s + b.views_count, 0), label: 'Vistas totales' },
          { icon: '⭐', value: books.length ? (books.reduce((s, b) => s + b.rating_avg, 0) / books.length).toFixed(1) : '0', label: 'Rating promedio' },
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
      draft:     'badge bg-gray-100 text-gray-600',
      published: 'badge bg-green-100 text-green-700',
      completed: 'badge bg-blue-100 text-blue-700',
    }[s] ?? 'badge';
  }
}

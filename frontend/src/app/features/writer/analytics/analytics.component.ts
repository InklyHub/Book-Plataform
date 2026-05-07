import { Component, inject, signal, OnInit, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { BookService } from '../../../core/services/book.service';
import { BookAnalytics } from '../../../core/models';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [RouterLink, DecimalPipe, SpinnerComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/writer" class="btn-ghost">← Volver</a>
        <h1 class="text-2xl font-bold text-gray-900">Analytics</h1>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20"><app-spinner size="lg" /></div>
      } @else {
      @if (data(); as d) {
        <!-- KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="card p-5 text-center">
            <p class="text-3xl font-bold text-purple-600">{{ d.total_views | number }}</p>
            <p class="text-sm text-gray-500 mt-1">Vistas del libro</p>
          </div>
          <div class="card p-5 text-center">
            <p class="text-3xl font-bold text-blue-600">{{ d.unique_readers | number }}</p>
            <p class="text-sm text-gray-500 mt-1">Lectores únicos</p>
          </div>
          <div class="card p-5 text-center">
            <p class="text-3xl font-bold text-pink-600">{{ d.total_likes | number }}</p>
            <p class="text-sm text-gray-500 mt-1">Likes totales</p>
          </div>
          <div class="card p-5 text-center">
            <p class="text-3xl font-bold text-yellow-500">⭐ {{ d.rating_avg | number:'1.1-1' }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ d.rating_count }} valoraciones</p>
          </div>
        </div>

        <!-- Tabla de capítulos -->
        <div class="card p-6">
          <h2 class="font-bold text-xl text-gray-900 mb-4">Rendimiento por capítulo</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="text-left py-2 text-gray-500 font-medium">#</th>
                  <th class="text-left py-2 text-gray-500 font-medium">Capítulo</th>
                  <th class="text-right py-2 text-gray-500 font-medium">Vistas</th>
                  <th class="text-right py-2 text-gray-500 font-medium">Likes</th>
                  <th class="text-right py-2 text-gray-500 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (ch of d.chapters; track ch.id) {
                  <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td class="py-3 text-gray-400 font-bold">{{ ch.number }}</td>
                    <td class="py-3 font-medium text-gray-800 max-w-xs truncate">{{ ch.title }}</td>
                    <td class="py-3 text-right text-gray-600">{{ ch.views | number }}</td>
                    <td class="py-3 text-right text-gray-600">{{ ch.likes | number }}</td>
                    <td class="py-3 text-right">
                      @if (ch.is_locked) {
                        <span class="badge bg-yellow-100 text-yellow-700">🔒 Bloqueado</span>
                      } @else {
                        <span class="badge bg-green-100 text-green-700">✅ Libre</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Barra de retención visual -->
        <div class="card p-6 mt-4">
          <h2 class="font-bold text-xl text-gray-900 mb-4">Retención de lectores</h2>
          @if (d.chapters.length > 0) {
            @for (ch of d.chapters; track ch.id) {
              <div class="flex items-center gap-3 mb-2">
                <span class="text-xs text-gray-500 w-6 text-right">{{ ch.number }}</span>
                <div class="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                    [style.width.%]="retention(ch.views, d.total_chapter_views)"></div>
                </div>
                <span class="text-xs text-gray-500 w-10 text-right">{{ ch.views }}</span>
              </div>
            }
          }
        </div>
      }
      }
    </div>
  `,
})
export class AnalyticsComponent implements OnInit {
  readonly bookId = input.required<string>();
  private readonly bookService = inject(BookService);

  readonly data = signal<BookAnalytics | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.bookService.getAnalytics(this.bookId()).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  retention(views: number, total: number): number {
    if (!total) return 0;
    return Math.min(100, Math.round((views / total) * 100));
  }
}

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
    <div class="p-4 sm:p-6">
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/writer"
           class="inline-flex items-center gap-1.5 text-sm text-ink-40 hover:text-ink transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </a>
        <h1>Analytics</h1>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20" aria-live="polite"><app-spinner size="lg" /></div>
      } @else {
        @if (data(); as d) {
          <!-- KPIs -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            @for (kpi of [
              { value: d.total_views, label: 'Vistas del libro', fmt: '1.0-0' },
              { value: d.unique_readers, label: 'Lectores únicos', fmt: '1.0-0' },
              { value: d.total_likes, label: 'Likes totales', fmt: '1.0-0' },
              { value: d.rating_avg, label: d.rating_count + ' valoraciones', fmt: '1.1-1' }
            ]; track kpi.label) {
              <div class="bg-white rounded-xl border border-ink-10 p-5">
                <p class="text-2xl font-bold text-ink tabular-nums">{{ kpi.value | number:kpi.fmt }}</p>
                <p class="text-sm text-ink-40 mt-1">{{ kpi.label }}</p>
              </div>
            }
          </div>

          <!-- Tabla de capítulos -->
          <div class="bg-white rounded-xl border border-ink-10 p-6 mb-4">
            <h2 class="mb-4">Rendimiento por capítulo</h2>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-ink-5">
                    <th class="text-left py-2 text-ink-40 font-semibold text-xs uppercase tracking-wider">#</th>
                    <th class="text-left py-2 text-ink-40 font-semibold text-xs uppercase tracking-wider">Capítulo</th>
                    <th class="text-right py-2 text-ink-40 font-semibold text-xs uppercase tracking-wider">Vistas</th>
                    <th class="text-right py-2 text-ink-40 font-semibold text-xs uppercase tracking-wider">Likes</th>
                    <th class="text-right py-2 text-ink-40 font-semibold text-xs uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ch of d.chapters; track ch.id) {
                    <tr class="border-b border-ink-5 hover:bg-ink-5 transition-colors">
                      <td class="py-3 text-ink-20 font-bold">{{ ch.number }}</td>
                      <td class="py-3 font-medium text-ink-60 max-w-xs truncate">{{ ch.title }}</td>
                      <td class="py-3 text-right text-ink-60 tabular-nums">{{ ch.views | number }}</td>
                      <td class="py-3 text-right text-ink-60 tabular-nums">{{ ch.likes | number }}</td>
                      <td class="py-3 text-right">
                        @if (ch.is_locked) {
                          <span class="badge-amber">Bloqueado</span>
                        } @else {
                          <span class="badge-amber">Libre</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Retención visual -->
          <div class="bg-white rounded-xl border border-ink-10 p-6">
            <h2 class="mb-5">Retención de lectores</h2>
            @if (d.chapters.length > 0) {
              <div class="space-y-2">
                @for (ch of d.chapters; track ch.id) {
                  <div class="flex items-center gap-3">
                    <span class="text-xs text-ink-40 w-6 text-right tabular-nums">{{ ch.number }}</span>
                    <div class="flex-1 h-4 bg-ink-5 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all"
                           style="background-color: #C46B1E;"
                           [style.width.%]="retention(ch.views, d.total_chapter_views)"></div>
                    </div>
                    <span class="text-xs text-ink-40 w-12 text-right tabular-nums">{{ ch.views | number }}</span>
                  </div>
                }
              </div>
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

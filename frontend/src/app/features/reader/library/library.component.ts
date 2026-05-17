import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { LibraryItem, LibraryStatus } from '../../../core/models';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

const TABS: { value: LibraryStatus | 'all'; label: string }[] = [
  { value: 'all',          label: 'Todos' },
  { value: 'reading',      label: 'Leyendo' },
  { value: 'want_to_read', label: 'Por leer' },
  { value: 'completed',    label: 'Completados' },
];

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [RouterLink, StarRatingComponent, SpinnerComponent],
  template: `
    <div class="p-4 sm:p-6">
      <div class="flex items-center justify-between mb-6">
        <h1>Mi Biblioteca</h1>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 mb-6 border-b border-ink-10 overflow-x-auto no-scrollbar"
           role="tablist" aria-label="Filtrar por estado de lectura">
        @for (tab of tabs; track tab.value) {
          <button
            role="tab"
            [attr.aria-selected]="activeTab() === tab.value"
            (click)="activeTab.set(tab.value); loadLibrary()"
            class="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 border-b-2 -mb-px"
            [class.border-ink]="activeTab() === tab.value"
            [class.text-ink]="activeTab() === tab.value"
            [class.border-transparent]="activeTab() !== tab.value"
            [class.text-ink-40]="activeTab() !== tab.value">
            {{ tab.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="flex justify-center py-24" aria-label="Cargando biblioteca" aria-live="polite">
          <app-spinner size="lg" />
        </div>
      } @else if (items().length === 0) {
        <div class="text-center py-24">
          <div class="w-14 h-14 rounded-xl bg-ink-5 flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7 text-ink-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>
          <p class="text-base font-semibold text-ink-60">Tu biblioteca está vacía</p>
          <p class="text-sm text-ink-40 mt-1 mb-5">Explora el catálogo y añade libros a tu colección</p>
          <a routerLink="/home" class="btn-primary">Explorar catálogo</a>
        </div>
      } @else {
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          @for (item of items(); track item.book.id) {
            <article class="bg-white rounded-xl border border-ink-10 p-4 flex gap-3
                            hover:border-ink-20 transition-colors duration-150">
              <!-- Portada -->
              <a [routerLink]="['/book', item.book.id]" class="flex-shrink-0"
                 [attr.aria-label]="'Ver ' + item.book.title">
                <div class="w-14 h-20 rounded-lg overflow-hidden bg-ink-5">
                  @if (item.book.cover_url) {
                    <img [src]="item.book.cover_url" [alt]="item.book.title + ' — portada'"
                         class="w-full h-full object-cover" loading="lazy" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <svg class="w-6 h-6 text-ink-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  }
                </div>
              </a>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <a [routerLink]="['/book', item.book.id]">
                  <h3 class="font-semibold text-sm text-ink line-clamp-2 leading-snug
                             hover:text-amber transition-colors duration-150">
                    {{ item.book.title }}
                  </h3>
                </a>
                <p class="text-xs text-ink-40 mt-0.5 mb-2">{{ item.book.author.username }}</p>
                <app-star-rating [value]="item.book.rating_avg" [count]="item.book.rating_count" />

                <div class="flex items-center gap-2 mt-3">
                  <label [for]="'status-' + item.book.id" class="sr-only">
                    Estado de lectura para {{ item.book.title }}
                  </label>
                  <select
                    [id]="'status-' + item.book.id"
                    [value]="item.status"
                    (change)="updateStatus(item.book.id, $any($event.target).value)"
                    class="input-field">
                    <option value="reading">Leyendo</option>
                    <option value="want_to_read">Por leer</option>
                    <option value="completed">Completado</option>
                  </select>

                  <button
                    (click)="removeFromLibrary(item.book.id)"
                    [attr.aria-label]="'Eliminar ' + item.book.title + ' de la biblioteca'"
                    class="text-xs text-ink-40 hover:text-red-500 transition-colors ml-auto">
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class LibraryComponent implements OnInit {
  private readonly bookService = inject(BookService);

  readonly tabs = TABS;
  readonly activeTab = signal<LibraryStatus | 'all'>('all');
  readonly items = signal<LibraryItem[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void { this.loadLibrary(); }

  loadLibrary(): void {
    this.loading.set(true);
    const status = this.activeTab() === 'all' ? undefined : this.activeTab();
    this.bookService.getLibrary(status).subscribe({
      next: items => { this.items.set(items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  updateStatus(bookId: string, status: LibraryStatus): void {
    this.bookService.updateLibraryStatus(bookId, status).subscribe(() => this.loadLibrary());
  }

  removeFromLibrary(bookId: string): void {
    this.bookService.removeFromLibrary(bookId).subscribe(() => {
      this.items.update(items => items.filter(i => i.book.id !== bookId));
    });
  }
}

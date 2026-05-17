import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { LibraryItem, LibraryStatus } from '../../../core/models';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

const TABS: { value: LibraryStatus | 'all'; label: string; icon: string }[] = [
  { value: 'all',          label: 'Todos',       icon: '📚' },
  { value: 'reading',      label: 'Leyendo',     icon: '📖' },
  { value: 'want_to_read', label: 'Por leer',    icon: '🔖' },
  { value: 'completed',    label: 'Completados', icon: '✅' },
];

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [RouterLink, StarRatingComponent, SpinnerComponent],
  template: `
    <div class="p-3 sm:p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Mi Biblioteca</h1>

      <!-- Tabs -->
      <div class="flex gap-2 flex-wrap mb-6">
        @for (tab of tabs; track tab.value) {
          <button
            (click)="activeTab.set(tab.value); loadLibrary()"
            [class]="'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ' +
                     (activeTab() === tab.value
                       ? 'bg-purple-600 text-white shadow-sm'
                       : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300')">
            {{ tab.icon }} {{ tab.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20"><app-spinner size="lg" /></div>
      } @else if (items().length === 0) {
        <div class="text-center py-20 text-gray-400">
          <p class="text-5xl mb-4">📭</p>
          <p class="text-lg font-medium">Tu biblioteca está vacía</p>
          <a routerLink="/home" class="btn-primary mt-4 inline-flex">Explorar libros</a>
        </div>
      } @else {
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          @for (item of items(); track item.book.id) {
            <div class="card p-4 flex gap-4 hover:shadow-md transition-all">
              <!-- Portada -->
              <a [routerLink]="['/book', item.book.id]" class="flex-shrink-0">
                <div class="w-16 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100">
                  @if (item.book.cover_url) {
                    <img [src]="item.book.cover_url" [alt]="item.book.title" class="w-full h-full object-cover" />
                  }
                </div>
              </a>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <a [routerLink]="['/book', item.book.id]">
                  <h3 class="font-semibold text-gray-900 line-clamp-2 hover:text-purple-600 transition-colors">{{ item.book.title }}</h3>
                </a>
                <p class="text-sm text-gray-500 mt-0.5">{{ item.book.author.username }}</p>
                <app-star-rating [value]="item.book.rating_avg" [count]="item.book.rating_count" class="mt-1" />

                <div class="flex items-center gap-2 mt-3">
                  <select
                    [value]="item.status"
                    (change)="updateStatus(item.book.id, $any($event.target).value)"
                    class="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500">
                    <option value="reading">Leyendo</option>
                    <option value="want_to_read">Por leer</option>
                    <option value="completed">Completado</option>
                  </select>

                  <button
                    (click)="removeFromLibrary(item.book.id)"
                    class="text-xs text-red-400 hover:text-red-600 transition-colors ml-auto">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
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

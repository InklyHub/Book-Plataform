import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../../core/services/book.service';
import { Book, Category, Genre } from '../../../core/models';
import { BookCardComponent } from '../../../shared/components/book-card/book-card.component';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'platform-originals', label: 'Originales' },
  { id: 'translations',       label: 'Traducciones' },
  { id: 'manga',              label: 'Manga' },
  { id: 'manhwa',             label: 'Manhwa / Cómics' },
  { id: 'ai-generated',       label: 'IA Generado' },
  { id: 'technical',          label: 'Técnicos' },
  { id: 'nsfw',               label: '🔞 NSFW (18+)' },
];

const GENRES: Genre[] = [
  'Romance','Fantasy','Sci-Fi','Drama','Horror',
  'Thriller','Mystery','Technical','Adventure','Historical',
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, BookCardComponent, NavbarComponent, SpinnerComponent],
  template: `
    <div>
      <app-navbar
        [searchValue]="searchQuery()"
        (searchChange)="searchQuery.set($event)"
        (search)="loadBooks()" />

      <div class="p-3 sm:p-6">
        <!-- Categorías -->
        <div class="overflow-x-auto no-scrollbar mb-2">
          <div class="flex gap-1.5 min-w-max">
            @for (cat of categories; track cat.id) {
              <button
                (click)="selectCategory(cat.id)"
                [class]="'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ' +
                         (selectedCategory() === cat.id
                           ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm'
                           : 'bg-white border border-gray-200 text-gray-500 hover:border-purple-300 hover:text-purple-600')">
                {{ cat.label }}
              </button>
            }
          </div>
        </div>

        <!-- Géneros -->
        <div class="overflow-x-auto no-scrollbar mb-4">
          <div class="flex gap-1 min-w-max py-1">
            <button
              (click)="selectedGenre.set(null); loadBooks()"
              [class]="'px-2 py-0.5 rounded text-[11px] font-medium transition-all ' +
                       (!selectedGenre() ? 'text-purple-700 bg-purple-50' : 'text-gray-400 hover:text-gray-600')">
              Todos
            </button>
            @for (g of genres; track g) {
              <button
                (click)="selectedGenre.set(g); loadBooks()"
                [class]="'px-2 py-0.5 rounded text-[11px] font-medium transition-all ' +
                         (selectedGenre() === g ? 'text-purple-700 bg-purple-50' : 'text-gray-400 hover:text-gray-600')">
                {{ g }}
              </button>
            }
          </div>
        </div>

        <!-- NSFW Warning -->
        @if (showNsfwWarning()) {
          <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div class="card p-6 max-w-sm w-full animate-fade-in">
              <div class="text-center mb-4">
                <span class="text-4xl">🔞</span>
                <h2 class="text-xl font-bold mt-2">Contenido para adultos</h2>
                <p class="text-gray-500 text-sm mt-1">Esta sección contiene contenido para mayores de 18 años.</p>
              </div>
              <div class="flex gap-3">
                <button class="btn-secondary flex-1" (click)="showNsfwWarning.set(false)">Cancelar</button>
                <button class="btn-primary flex-1" (click)="confirmNsfw()">Soy mayor de edad</button>
              </div>
            </div>
          </div>
        }

        <!-- Grid de libros -->
        @if (loading()) {
          <div class="flex justify-center items-center py-20">
            <app-spinner size="lg" />
          </div>
        } @else if (books().length === 0) {
          <div class="text-center py-20 text-gray-400">
            <p class="text-5xl mb-4">📭</p>
            <p class="text-lg font-medium">No hay libros en esta categoría</p>
            <p class="text-sm mt-1">Intenta con otra categoría o búsqueda</p>
          </div>
        } @else {
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            @for (book of books(); track book.id) {
              <app-book-card [book]="book" />
            }
          </div>

          <!-- Paginación -->
          @if (totalPages() > 1) {
            <div class="flex justify-center items-center gap-2 mt-6">
              <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-purple-50 hover:border-purple-300 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-all"
                [disabled]="page() === 1" (click)="changePage(page() - 1)">←</button>
              <span class="text-xs text-gray-500 px-2">{{ page() }} / {{ totalPages() }}</span>
              <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-purple-50 hover:border-purple-300 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-all"
                [disabled]="page() === totalPages()" (click)="changePage(page() + 1)">→</button>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  private readonly bookService = inject(BookService);

  readonly categories = CATEGORIES;
  readonly genres = GENRES;

  readonly selectedCategory = signal<Category>('platform-originals');
  readonly selectedGenre = signal<Genre | null>(null);
  readonly searchQuery = signal('');
  readonly books = signal<Book[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly showNsfwWarning = signal(false);
  readonly nsfwConfirmed = signal(false);

  ngOnInit(): void {
    this.loadBooks();
  }

  selectCategory(cat: Category): void {
    if (cat === 'nsfw' && !this.nsfwConfirmed()) {
      this.showNsfwWarning.set(true);
      return;
    }
    this.selectedCategory.set(cat);
    this.page.set(1);
    this.loadBooks();
  }

  confirmNsfw(): void {
    this.nsfwConfirmed.set(true);
    this.showNsfwWarning.set(false);
    this.selectedCategory.set('nsfw');
    this.loadBooks();
  }

  loadBooks(): void {
    this.loading.set(true);
    this.bookService.getBooks({
      category: this.selectedCategory(),
      genre: this.selectedGenre() ?? undefined,
      q: this.searchQuery() || undefined,
      page: this.page(),
      size: 20,
    }).subscribe({
      next: res => {
        this.books.set(res.items);
        this.totalPages.set(res.pages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  changePage(p: number): void {
    this.page.set(p);
    this.loadBooks();
  }
}

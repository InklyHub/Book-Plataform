import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { Book, Category, Genre } from '../../../core/models';
import { BookCardComponent } from '../../../shared/components/book-card/book-card.component';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'platform-originals', label: 'Originales' },
  { id: 'translations',       label: 'Traducciones' },
  { id: 'manga',              label: 'Manga' },
  { id: 'manhwa',             label: 'Manhwa' },
  { id: 'ai-generated',       label: 'IA Generado' },
  { id: 'technical',          label: 'Técnicos' },
  { id: 'nsfw',               label: 'NSFW 18+' },
];

const GENRES: Genre[] = [
  'Romance','Fantasy','Sci-Fi','Drama','Horror',
  'Thriller','Mystery','Technical','Adventure','Historical',
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, RouterLink, BookCardComponent, NavbarComponent, SpinnerComponent],
  template: `
    <div>
      <app-navbar
        [searchValue]="searchQuery()"
        (searchChange)="searchQuery.set($event)"
        (search)="loadBooks()" />

      <!-- ── Hero ──────────────────────────────────────────────────────── -->
      <section class="relative overflow-hidden" style="background-color: #1A1410;" aria-label="Bienvenida">

        <!-- Radial amber glow -->
        <div class="absolute inset-0 pointer-events-none"
             style="background: radial-gradient(ellipse at 25% 60%, rgba(196,107,30,0.18) 0%, transparent 60%);"></div>

        <div class="relative max-w-6xl mx-auto px-6 sm:px-10 py-14 sm:py-20
                    flex items-center justify-between gap-10">

          <!-- Left: copy -->
          <div class="flex-1 min-w-0 max-w-xl">

            <div class="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest"
                 style="background-color: rgba(196,107,30,0.15); color: #C46B1E;">
              Novedades esta semana
            </div>

            <h1 class="text-4xl sm:text-5xl font-bold leading-tight mb-5"
                style="color: #FAF6F0; font-family: 'Playfair Display', Georgia, serif;">
              Historias que<br>
              <em style="color: #C46B1E; font-style: italic;">importan,</em> mundos<br>
              que te esperan
            </h1>

            <p class="text-sm sm:text-base leading-relaxed mb-8" style="color: #8C7B70;">
              Lee y escribe con una comunidad de más de 40.000 lectores.
              Descubre nuevos autores, sigue tu progreso y gana logros mientras lees.
            </p>

            <div class="flex gap-3 flex-wrap">
              <button class="btn-primary" (click)="scrollToBooks()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Explorar libros
              </button>
              <a routerLink="/writer/new" class="btn-outline">Empieza a escribir</a>
            </div>
          </div>

          <!-- Right: staggered book covers -->
          @if (heroBooks().length > 0) {
            <div class="hidden lg:flex items-end gap-3 flex-shrink-0 pb-2" aria-hidden="true">
              @for (book of heroBooks(); track book.id; let i = $index) {
                <div class="w-28 rounded-lg overflow-hidden flex-shrink-0 book-card-cover"
                     [style.margin-bottom.px]="[0, 32, 16][i] ?? 0">
                  @if (book.cover_url) {
                    <img [src]="book.cover_url" [alt]="book.title"
                         class="w-full h-40 object-cover" loading="lazy" />
                  } @else {
                    <div class="w-full h-40 rounded-lg"
                         [style.background]="['linear-gradient(135deg,#3A2F27,#1A1410)',
                                              'linear-gradient(135deg,#2A1F16,#4A3020)',
                                              'linear-gradient(135deg,#1E2535,#2A1A10)'][i]">
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- ── Contenido ─────────────────────────────────────────────────── -->
      <div id="books-section" class="p-4 sm:p-6">

        <!-- Categorías -->
        <div class="overflow-x-auto mb-1 no-scrollbar" style="-webkit-overflow-scrolling: touch;">
          <div class="flex gap-1.5 min-w-max pb-1" role="tablist" aria-label="Categorías de contenido">
            @for (cat of categories; track cat.id) {
              <button
                role="tab"
                [attr.aria-selected]="selectedCategory() === cat.id"
                (click)="selectCategory(cat.id)"
                class="px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150"
                [style.background-color]="selectedCategory() === cat.id ? '#1A1410' : '#FFFFFF'"
                [style.color]="selectedCategory() === cat.id ? '#FAF6F0' : '#5C4E44'"
                [style.border]="selectedCategory() !== cat.id ? '1px solid #DDD6D1' : '1px solid transparent'">
                {{ cat.label }}
              </button>
            }
          </div>
        </div>

        <!-- Filtro de géneros -->
        <div class="overflow-x-auto mb-6 no-scrollbar" style="-webkit-overflow-scrolling: touch;">
          <div class="flex gap-0.5 min-w-max py-1">
            <button
              (click)="selectedGenre.set(null); loadBooks()"
              class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors duration-150"
              [style.color]="!selectedGenre() ? '#1A1410' : '#8C7B70'"
              [style.background-color]="!selectedGenre() ? '#F0EBE6' : 'transparent'">
              Todos
            </button>
            @for (g of genres; track g) {
              <button
                (click)="selectedGenre.set(g); loadBooks()"
                class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors duration-150"
                [style.color]="selectedGenre() === g ? '#1A1410' : '#8C7B70'"
                [style.background-color]="selectedGenre() === g ? '#F0EBE6' : 'transparent'">
                {{ g }}
              </button>
            }
          </div>
        </div>

        <!-- Modal NSFW -->
        @if (showNsfwWarning()) {
          <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
               role="dialog" aria-modal="true" aria-labelledby="nsfw-title">
            <div class="bg-white rounded-xl p-6 max-w-sm w-full animate-fade-in shadow-lg"
                 style="border: 1px solid #DDD6D1;">
              <div class="mb-5">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                     style="background-color: #F5E0DA;">
                  <svg class="w-5 h-5" style="color: #A8432B;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 id="nsfw-title" class="text-lg font-bold"
                    style="color: #1A1410; font-family: 'Playfair Display', Georgia, serif;">
                  Contenido para adultos
                </h2>
                <p class="text-sm mt-1.5 leading-relaxed" style="color: #5C4E44;">
                  Esta sección contiene contenido exclusivo para mayores de 18 años. ¿Confirmas que eres mayor de edad?
                </p>
              </div>
              <div class="flex gap-3">
                <button class="btn-secondary flex-1" (click)="showNsfwWarning.set(false)">Cancelar</button>
                <button class="btn-primary flex-1" (click)="confirmNsfw()">Confirmar</button>
              </div>
            </div>
          </div>
        }

        <!-- Sección "En tendencia" -->
        <div class="flex items-center justify-between mb-5">
          <h2 style="font-family: 'Playfair Display', Georgia, serif; color: #1A1410;"
              class="text-xl font-bold tracking-tight">
            En tendencia
          </h2>
          @if (totalPages() > 1) {
            <button (click)="changePage(page() + 1)" [disabled]="page() === totalPages()"
                    class="text-sm font-semibold hover:underline disabled:opacity-40"
                    style="color: #C46B1E;">
              Ver todos →
            </button>
          }
        </div>

        <!-- Grid de libros -->
        @if (loading()) {
          <div class="flex justify-center items-center py-24" aria-label="Cargando libros" aria-live="polite">
            <app-spinner size="lg" />
          </div>
        } @else if (books().length === 0) {
          <div class="text-center py-24">
            <div class="w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-4"
                 style="background-color: #F0EBE6;">
              <svg class="w-7 h-7 text-ink-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-base font-semibold text-ink-60">Sin resultados</p>
            <p class="text-sm text-ink-40 mt-1">Prueba con otra categoría o búsqueda</p>
          </div>
        } @else {
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-6">
            @for (book of books(); track book.id) {
              <app-book-card [book]="book" />
            }
          </div>

          <!-- Paginación -->
          @if (totalPages() > 1) {
            <nav class="flex justify-center items-center gap-2 mt-10" aria-label="Paginación">
              <button
                class="w-8 h-8 flex items-center justify-center rounded-full border border-ink-10 text-ink-60
                       bg-white hover:bg-ink-5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                [disabled]="page() === 1" (click)="changePage(page() - 1)"
                aria-label="Página anterior">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span class="text-xs text-ink-40 px-2 font-medium" aria-live="polite">
                {{ page() }} / {{ totalPages() }}
              </span>
              <button
                class="w-8 h-8 flex items-center justify-center rounded-full border border-ink-10 text-ink-60
                       bg-white hover:bg-ink-5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                [disabled]="page() === totalPages()" (click)="changePage(page() + 1)"
                aria-label="Página siguiente">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
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

  readonly heroBooks = computed(() => this.books().slice(0, 3));

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

  scrollToBooks(): void {
    document.getElementById('books-section')?.scrollIntoView({ behavior: 'smooth' });
  }
}

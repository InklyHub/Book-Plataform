import { Component, inject, signal, computed, effect, OnInit, OnDestroy, input, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../../core/services/book.service';
import { Chapter, ChapterSummary, Comment } from '../../../core/models';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-book-reader',
  standalone: true,
  imports: [RouterLink, FormsModule, SpinnerComponent],
  template: `
    @if (loading()) {
      <div class="flex justify-center items-center min-h-screen bg-gray-950">
        <app-spinner size="lg" />
      </div>
    } @else {
    @if (chapter(); as ch) {
      <div class="min-h-screen flex flex-col" [class]="themeBg()">
        <!-- Barra superior -->
        <header class="sticky top-0 z-40 border-b" [class]="themeHeader()">
          <div class="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
            <a [routerLink]="['/book', bookId()]" class="p-2 rounded-lg hover:bg-gray-100/10 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">{{ ch.title }}</p>
              <p class="text-xs opacity-60">Cap. {{ ch.chapter_number }}</p>
            </div>
            <!-- Controles -->
            <div class="flex items-center gap-2">
              <button (click)="liked() ? null : toggleLike()" [class]="'p-2 rounded-lg transition-colors ' + (liked() ? 'text-red-500' : 'hover:bg-gray-100/10')">
                ❤️ {{ ch.likes_count }}
              </button>
              <button (click)="showSettings.set(!showSettings())" class="p-2 rounded-lg hover:bg-gray-100/10">⚙️</button>
              <button (click)="showComments.set(!showComments())" class="p-2 rounded-lg hover:bg-gray-100/10">
                💬
              </button>
            </div>
          </div>
          <!-- Barra de progreso -->
          <div class="h-0.5 bg-gray-200/20">
            <div class="h-full bg-purple-500 transition-all duration-300" [style.width.%]="scrollPercent()"></div>
          </div>
        </header>

        <!-- Panel de configuración -->
        @if (showSettings()) {
          <div class="fixed top-14 right-4 z-50 card p-4 w-60 animate-fade-in">
            <h3 class="font-semibold text-gray-800 mb-3">Opciones de lectura</h3>
            <div class="space-y-3">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Tamaño de fuente</label>
                <input type="range" min="14" max="24" [value]="fontSize()"
                  (input)="fontSize.set(+$any($event.target).value)" class="w-full" />
                <span class="text-xs text-gray-500">{{ fontSize() }}px</span>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-2 block">Tema</label>
                <div class="flex gap-2">
                  @for (t of themes; track t.value) {
                    <button (click)="selectedTheme.set(t.value)"
                      [class]="'flex-1 py-1.5 rounded-lg text-xs border transition-all ' +
                               (selectedTheme() === t.value ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-200')
                               + ' ' + t.bg + ' ' + t.text">
                      {{ t.label }}
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Contenido -->
        <main class="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">
          <h1 class="text-2xl font-bold mb-8" [class]="themeTitle()">{{ ch.title }}</h1>
          <div class="leading-relaxed whitespace-pre-wrap" [style.fontSize.px]="fontSize()"
            [class]="themeText()" [innerHTML]="ch.content"></div>

          <!-- Navegación entre capítulos -->
          <div class="flex justify-between items-center mt-16 pt-8 border-t border-gray-200/30">
            <span class="text-sm opacity-60">Cap. {{ ch.chapter_number }}</span>
            <div class="flex gap-3">
              @if (prevChapter()) {
                <button class="btn-secondary text-sm" (click)="goToChapter(prevChapter()!.id)">← Anterior</button>
              }
              @if (nextChapter()) {
                <button class="btn-secondary text-sm" (click)="goToChapter(nextChapter()!.id)">Siguiente →</button>
              } @else {
                <button class="btn-secondary text-sm opacity-40 cursor-not-allowed" disabled>Último capítulo</button>
              }
            </div>
          </div>
        </main>

        <!-- Panel de comentarios -->
        @if (showComments()) {
          <div class="fixed inset-0 md:inset-auto md:right-0 md:top-0 h-screen w-full md:w-80 bg-white shadow-2xl z-50 flex flex-col animate-fade-in">
            <div class="flex items-center justify-between p-4 border-b">
              <h3 class="font-bold text-gray-900">Comentarios</h3>
              <button (click)="showComments.set(false)" class="p-1 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div class="flex-1 overflow-y-auto p-4 space-y-3">
              @for (c of comments(); track c.id) {
                <div class="flex gap-2">
                  <div class="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-sm font-bold flex-shrink-0">
                    {{ c.author.username[0].toUpperCase() }}
                  </div>
                  <div class="flex-1">
                    <p class="text-xs font-semibold text-gray-700">{{ c.author.username }}</p>
                    <p class="text-sm text-gray-600 mt-0.5">{{ c.text }}</p>
                  </div>
                </div>
              }
              @if (comments().length === 0) {
                <p class="text-center text-gray-400 text-sm py-8">Sin comentarios aún. ¡Sé el primero!</p>
              }
            </div>
            <div class="p-4 border-t">
              <div class="flex gap-2">
                <input [(ngModel)]="newComment" type="text" placeholder="Escribe un comentario..."
                  class="input-field text-sm flex-1" (keyup.enter)="addComment()" />
                <button (click)="addComment()" class="btn-primary text-sm px-3">→</button>
              </div>
            </div>
          </div>
        }
      </div>
    }
    }
  `,
})
export class BookReaderComponent implements OnInit, OnDestroy {
  readonly bookId = input.required<string>();
  readonly chapterId = input.required<string>();

  private readonly bookService = inject(BookService);
  private readonly router = inject(Router);

  readonly chapter = signal<Chapter | null>(null);
  readonly chapters = signal<ChapterSummary[]>([]);
  readonly comments = signal<Comment[]>([]);
  readonly loading = signal(true);
  readonly liked = signal(false);
  readonly scrollPercent = signal(0);
  readonly showSettings = signal(false);
  readonly showComments = signal(false);
  readonly fontSize = signal(18);
  readonly selectedTheme = signal<'light' | 'sepia' | 'dark'>('light');
  newComment = '';

  private saveTimer: any;

  readonly prevChapter = computed(() => {
    const list = this.chapters();
    const idx = list.findIndex(c => c.id === this.chapterId());
    return idx > 0 ? list[idx - 1] : null;
  });

  readonly nextChapter = computed(() => {
    const list = this.chapters();
    const idx = list.findIndex(c => c.id === this.chapterId());
    return idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
  });

  readonly themes: { value: 'light' | 'sepia' | 'dark'; label: string; bg: string; text: string }[] = [
    { value: 'light', label: 'Claro', bg: 'bg-white', text: 'text-gray-900' },
    { value: 'sepia', label: 'Sepia', bg: 'bg-amber-50', text: 'text-amber-900' },
    { value: 'dark',  label: 'Oscuro', bg: 'bg-gray-900', text: 'text-gray-100' },
  ];

  constructor() {
    effect(() => {
      const id = this.chapterId();
      this.loading.set(true);
      this.liked.set(false);
      this.bookService.getChapter(id).subscribe({
        next: ch => { this.chapter.set(ch); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
      this.bookService.getComments(id).subscribe(cs => this.comments.set(cs));
    });
  }

  ngOnInit(): void {
    this.bookService.getChapters(this.bookId()).subscribe(chs => this.chapters.set(chs));
  }

  ngOnDestroy(): void {
    clearTimeout(this.saveTimer);
    this.bookService.saveProgress(this.chapterId(), this.scrollPercent()).subscribe();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    this.scrollPercent.set(pct);

    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.bookService.saveProgress(this.chapterId(), pct, pct >= 95).subscribe();
    }, 2000);
  }

  goToChapter(chapterId: string): void {
    window.scrollTo(0, 0);
    this.router.navigate(['/read', this.bookId(), chapterId]);
  }

  toggleLike(): void {
    this.bookService.toggleLike(this.chapterId()).subscribe(res => {
      this.liked.set(res.liked);
      this.chapter.update(c => c ? { ...c, likes_count: res.likes_count } : c);
    });
  }

  addComment(): void {
    if (!this.newComment.trim()) return;
    this.bookService.addComment(this.chapterId(), this.newComment).subscribe(c => {
      this.comments.update(cs => [c, ...cs]);
      this.newComment = '';
    });
  }

  themeBg = () => ({
    light: 'bg-gray-50 text-gray-900',
    sepia: 'bg-amber-50 text-amber-900',
    dark: 'bg-gray-950 text-gray-100',
  }[this.selectedTheme()]);

  themeHeader = () => ({
    light: 'bg-white/90 backdrop-blur text-gray-900 border-gray-200',
    sepia: 'bg-amber-100/90 backdrop-blur text-amber-900 border-amber-200',
    dark: 'bg-gray-900/90 backdrop-blur text-gray-100 border-gray-800',
  }[this.selectedTheme()]);

  themeTitle = () => ({
    light: 'text-gray-900',
    sepia: 'text-amber-900',
    dark: 'text-gray-100',
  }[this.selectedTheme()]);

  themeText = () => ({
    light: 'text-gray-700',
    sepia: 'text-amber-800',
    dark: 'text-gray-300',
  }[this.selectedTheme()]);
}

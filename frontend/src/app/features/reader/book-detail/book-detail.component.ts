import { Component, inject, signal, OnInit, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { BookService } from '../../../core/services/book.service';
import { MonetizationService } from '../../../core/services/monetization.service';
import { AuthService } from '../../../core/services/auth.service';
import { Book, ChapterSummary, QuizSummary } from '../../../core/models';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { CoinBadgeComponent } from '../../../shared/components/coin-badge/coin-badge.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, StarRatingComponent, CoinBadgeComponent, SpinnerComponent],
  template: `
    @if (loading()) {
      <div class="flex justify-center items-center min-h-screen"><app-spinner size="lg" /></div>
    } @else {
    @if (book(); as b) {
      <div class="min-h-screen bg-gray-50">
        <!-- Hero banner -->
        <div class="relative bg-gradient-to-r from-purple-900 to-blue-900 text-white">
          <div class="absolute inset-0 opacity-20">
            @if (b.cover_url) {
              <img [src]="b.cover_url" class="w-full h-full object-cover" alt="" />
            }
          </div>
          <div class="relative max-w-5xl mx-auto px-6 py-10 flex gap-8">
            <!-- Portada -->
            <div class="w-36 h-52 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 bg-white/10">
              @if (b.cover_url) {
                <img [src]="b.cover_url" [alt]="b.title" class="w-full h-full object-cover" />
              } @else {
                <div class="w-full h-full flex items-center justify-center text-5xl">📖</div>
              }
            </div>
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap gap-2 mb-3">
                <span class="badge-purple">{{ b.genre }}</span>
                <span class="badge bg-white/20 text-white">{{ categoryLabel(b.category) }}</span>
                @if (b.age_restriction) { <span class="badge bg-red-500 text-white">18+</span> }
              </div>
              <h1 class="text-3xl font-bold leading-tight mb-2">{{ b.title }}</h1>
              <p class="text-white/80 text-sm mb-3">por <span class="text-white font-medium">{{ b.author.username }}</span></p>

              <div class="flex items-center gap-4 mb-4 text-sm text-white/80">
                <app-star-rating [value]="b.rating_avg" [count]="b.rating_count" />
                <span>👁️ {{ b.views_count | number }} vistas</span>
                <span>📑 {{ b.chapters_count }} capítulos</span>
              </div>

              <p class="text-white/70 text-sm leading-relaxed line-clamp-3">{{ b.description }}</p>

              <div class="flex gap-3 mt-5">
                @if (chapters().length > 0) {
                  <a [routerLink]="['/read', b.id, chapters()[0].id]" class="btn-primary">
                    Empezar a leer
                  </a>
                }
                <button (click)="addToLibrary()" class="btn-secondary bg-white/10 border-white/30 text-white hover:bg-white/20">
                  {{ inLibrary() ? '✅ En biblioteca' : '+ Biblioteca' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="max-w-5xl mx-auto px-6 py-8 grid md:grid-cols-3 gap-8">
          <!-- Capítulos -->
          <div class="md:col-span-2">
            <h2 class="font-bold text-xl mb-4 text-gray-900">Capítulos ({{ chapters().length }})</h2>
            @if (loadingChapters()) {
              <app-spinner />
            } @else {
              <div class="space-y-2">
                @for (ch of chapters(); track ch.id) {
                  <div class="card p-4 flex items-center gap-4 hover:shadow-sm transition-all">
                    <span class="text-2xl font-bold text-gray-200 w-8 text-center flex-shrink-0">{{ ch.chapter_number }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-gray-900 truncate">{{ ch.title }}</p>
                      <div class="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span>👁️ {{ ch.views_count }}</span>
                        <span>❤️ {{ ch.likes_count }}</span>
                        @if (ch.is_locked) { <app-coin-badge [amount]="ch.price_coins ?? 0" /> }
                      </div>
                    </div>
                    @if (ch.is_locked) {
                      <button (click)="unlockChapter(ch)" class="btn-secondary text-sm">
                        🔒 Desbloquear
                      </button>
                    } @else {
                      <a [routerLink]="['/read', b.id, ch.id]" class="btn-primary text-sm">Leer</a>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Sidebar -->
          <div class="space-y-4">
            <!-- Rating -->
            <div class="card p-4">
              <h3 class="font-semibold text-gray-800 mb-3">Tu valoración</h3>
              <app-star-rating [value]="userRating()" [interactive]="true" [showCount]="false" size="md"
                (rate)="rateBook($event)" />
            </div>

            <!-- Tags -->
            @if (b.tags.length) {
              <div class="card p-4">
                <h3 class="font-semibold text-gray-800 mb-3">Etiquetas</h3>
                <div class="flex flex-wrap gap-2">
                  @for (tag of b.tags; track tag) {
                    <span class="badge-blue">{{ tag }}</span>
                  }
                </div>
              </div>
            }

            <!-- Quizzes -->
            @if (quizzes().length) {
              <div class="card p-4">
                <h3 class="font-semibold text-gray-800 mb-3">📝 Quizzes</h3>
                <div class="space-y-2">
                  @for (q of quizzes(); track q.id) {
                    <a [routerLink]="['/quiz', q.id]"
                      class="flex items-center justify-between p-2 rounded-lg hover:bg-purple-50 transition-colors">
                      <span class="text-sm font-medium text-gray-700">{{ q.title }}</span>
                      <span class="text-xs text-gray-400">{{ q.question_count }} preguntas</span>
                    </a>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
    }

    <!-- Modal unlock -->
    @if (unlockTarget()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="card p-6 max-w-sm w-full animate-fade-in">
          <h2 class="text-xl font-bold text-gray-900 mb-2">Desbloquear capítulo</h2>
          <p class="text-gray-500 text-sm mb-4">
            Este capítulo cuesta <strong class="text-gray-900">{{ unlockTarget()!.price_coins }} coins</strong>.
            Tienes <strong class="text-gray-900">{{ auth.coins() }}</strong> coins.
          </p>
          <div class="flex gap-3">
            <button class="btn-secondary flex-1" (click)="unlockTarget.set(null)">Cancelar</button>
            <button class="btn-primary flex-1" (click)="confirmUnlock()" [disabled]="unlocking()">
              @if (unlocking()) { <app-spinner size="sm" /> } @else { Confirmar }
            </button>
          </div>
          @if (unlockError()) {
            <p class="text-red-500 text-xs text-center mt-2">{{ unlockError() }}</p>
          }
        </div>
      </div>
    }
  `,
})
export class BookDetailComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly bookService = inject(BookService);
  private readonly monetizationService = inject(MonetizationService);
  readonly auth = inject(AuthService);

  readonly book = signal<Book | null>(null);
  readonly chapters = signal<ChapterSummary[]>([]);
  readonly quizzes = signal<QuizSummary[]>([]);
  readonly loading = signal(true);
  readonly loadingChapters = signal(true);
  readonly inLibrary = signal(false);
  readonly userRating = signal(0);
  readonly unlockTarget = signal<ChapterSummary | null>(null);
  readonly unlocking = signal(false);
  readonly unlockError = signal('');

  ngOnInit(): void {
    this.bookService.getBook(this.id()).subscribe({
      next: b => { this.book.set(b); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.bookService.getChapters(this.id()).subscribe(chs => {
      this.chapters.set(chs);
      this.loadingChapters.set(false);
    });
    this.bookService.getQuizzes(this.id()).subscribe(qs => this.quizzes.set(qs));
  }

  categoryLabel(cat: string): string {
    const map: Record<string, string> = {
      'platform-originals': 'Original', 'translations': 'Traducción',
      'manga': 'Manga', 'manhwa': 'Manhwa', 'ai-generated': 'IA',
      'technical': 'Técnico', 'nsfw': 'NSFW',
    };
    return map[cat] ?? cat;
  }

  addToLibrary(): void {
    if (this.inLibrary()) return;
    this.bookService.addToLibrary(this.id()).subscribe(() => this.inLibrary.set(true));
  }

  rateBook(score: number): void {
    this.userRating.set(score);
    this.bookService.rateBook(this.id(), score).subscribe(res => {
      this.book.update(b => b ? { ...b, rating_avg: res.rating_avg, rating_count: res.rating_count } : b);
    });
  }

  unlockChapter(ch: ChapterSummary): void {
    this.unlockTarget.set(ch);
    this.unlockError.set('');
  }

  confirmUnlock(): void {
    const ch = this.unlockTarget();
    if (!ch) return;
    this.unlocking.set(true);
    this.monetizationService.unlockChapter(ch.id).subscribe({
      next: () => {
        this.chapters.update(chs => chs.map(c => c.id === ch.id ? { ...c, is_locked: false } : c));
        this.unlockTarget.set(null);
        this.unlocking.set(false);
      },
      error: (err) => {
        this.unlockError.set(err.message);
        this.unlocking.set(false);
      },
    });
  }
}

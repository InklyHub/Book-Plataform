import { Component, inject, signal, OnInit, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { Book, Chapter, ChapterSummary, Genre, Category, BookStatus } from '../../../core/models';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

const GENRES = ['Romance','Fantasy','Sci-Fi','Drama','Horror','Thriller','Mystery','Technical','Adventure','Historical'];
const CATEGORIES = [
  { value: 'platform-originals', label: 'Original de plataforma' },
  { value: 'translations',       label: 'Traducción' },
  { value: 'manga',              label: 'Manga' },
  { value: 'manhwa',             label: 'Manhwa / Cómics' },
  { value: 'ai-generated',       label: 'IA Generado' },
  { value: 'technical',          label: 'Libro técnico' },
  { value: 'nsfw',               label: '🔞 NSFW (18+)' },
];

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, SpinnerComponent],
  template: `
    <div class="p-6 max-w-4xl">
      <!-- Tabs -->
      <div class="flex gap-4 mb-6 border-b border-gray-200">
        <button [class]="tabClass('book')" (click)="activeTab.set('book')">📋 Info del libro</button>
        <button [class]="tabClass('chapters')" (click)="activeTab.set('chapters')" [disabled]="!bookId()">
          📑 Capítulos {{ bookId() ? '(' + chapters().length + ')' : '' }}
        </button>
      </div>

      <!-- Tab: Info del libro -->
      @if (activeTab() === 'book') {
        <form [formGroup]="bookForm" (ngSubmit)="saveBook()" class="space-y-5">
          <div class="grid md:grid-cols-2 gap-5">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Título del libro *</label>
              <input formControlName="title" type="text" class="input-field" placeholder="El nombre de tu obra..." />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Género *</label>
              <select formControlName="genre" class="input-field">
                <option value="">Selecciona un género</option>
                @for (g of genres; track g) { <option [value]="g">{{ g }}</option> }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Categoría *</label>
              <select formControlName="category" class="input-field">
                <option value="">Selecciona una categoría</option>
                @for (c of categories; track c.value) { <option [value]="c.value">{{ c.label }}</option> }
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
              <textarea formControlName="description" rows="4"
                placeholder="La sinopsis de tu libro..."
                class="input-field resize-none"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Etiquetas (separadas por coma)</label>
              <input formControlName="tagsInput" type="text" class="input-field" placeholder="magia, aventura, épico..." />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
              <select formControlName="status" class="input-field">
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="completed">Completado</option>
              </select>
            </div>
          </div>

          @if (bookError()) {
            <div class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{{ bookError() }}</div>
          }
          @if (bookSuccess()) {
            <div class="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-xl">{{ bookSuccess() }}</div>
          }

          <div class="flex gap-3">
            <button type="submit" class="btn-primary" [disabled]="savingBook() || bookForm.invalid">
              @if (savingBook()) { <app-spinner size="sm" /> } @else { {{ bookId() ? 'Actualizar libro' : 'Crear libro' }} }
            </button>
            @if (bookId()) {
              <button type="button" class="btn-secondary" (click)="activeTab.set('chapters')">
                Ver capítulos →
              </button>
            }
          </div>
        </form>
      }

      <!-- Tab: Capítulos -->
      @if (activeTab() === 'chapters') {
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Lista de capítulos -->
          <div>
            <h2 class="font-bold text-gray-900 mb-4">Capítulos</h2>
            @if (chapters().length === 0) {
              <div class="card p-6 text-center text-gray-400">
                <p class="text-3xl mb-2">📭</p>
                <p>Aún no hay capítulos</p>
              </div>
            } @else {
              <div class="space-y-2">
                @for (ch of chapters(); track ch.id) {
                  <div [class]="'card p-3 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all ' +
                               (editingChapter()?.id === ch.id ? 'border-purple-400 ring-1 ring-purple-400' : '')"
                    (click)="selectChapter(ch)">
                    <span class="text-lg font-bold text-gray-200 w-6 text-center flex-shrink-0">{{ ch.chapter_number }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-sm text-gray-900 truncate">{{ ch.title }}</p>
                      <p class="text-xs text-gray-400">
                        @if (ch.is_locked) { 🔒 {{ ch.price_coins }} coins · }
                        👁️ {{ ch.views_count }}
                      </p>
                    </div>
                    <button (click)="deleteChapter($event, ch.id)" class="text-red-400 hover:text-red-600 p-1 rounded">🗑️</button>
                  </div>
                }
              </div>
            }
            <button class="btn-secondary w-full mt-3 text-sm" (click)="newChapter()">+ Nuevo capítulo</button>
          </div>

          <!-- Editor de capítulo -->
          @if (chapterForm) {
            <div class="card p-4">
              <h3 class="font-semibold text-gray-900 mb-3">
                {{ editingChapter() ? 'Editar capítulo ' + editingChapter()!.chapter_number : 'Nuevo capítulo' }}
              </h3>
              <form [formGroup]="chapterForm" (ngSubmit)="saveChapter()" class="space-y-3">
                <div class="flex gap-3">
                  <div class="w-24">
                    <label class="text-xs text-gray-500 mb-1 block">Nro.</label>
                    <input formControlName="chapter_number" type="number" class="input-field text-sm" min="1" />
                  </div>
                  <div class="flex-1">
                    <label class="text-xs text-gray-500 mb-1 block">Título</label>
                    <input formControlName="title" type="text" class="input-field text-sm" />
                  </div>
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">Contenido</label>
                  <textarea formControlName="content" rows="10" class="input-field text-sm resize-none font-mono"></textarea>
                </div>
                <div class="flex items-center gap-3">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" formControlName="is_locked" class="rounded" />
                    <span class="text-sm text-gray-700">🔒 Bloqueado</span>
                  </label>
                  @if (chapterForm.get('is_locked')?.value) {
                    <div class="flex items-center gap-2">
                      <input formControlName="price_coins" type="number" min="1"
                        class="input-field text-sm w-24" placeholder="Coins" />
                      <span class="text-xs text-gray-500">🪙</span>
                    </div>
                  }
                </div>
                <div class="flex gap-2">
                  <button type="submit" class="btn-primary flex-1 text-sm" [disabled]="savingChapter()">
                    @if (savingChapter()) { <app-spinner size="sm" /> }
                    @else { {{ editingChapter() ? 'Actualizar' : 'Crear capítulo' }} }
                  </button>
                  <button type="button" class="btn-secondary text-sm" (click)="clearChapterForm()">Cancelar</button>
                </div>
              </form>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class EditorComponent implements OnInit {
  readonly bookId = input<string | undefined>(undefined);

  private readonly bookService = inject(BookService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<'book' | 'chapters'>('book');
  readonly chapters = signal<ChapterSummary[]>([]);
  readonly editingChapter = signal<ChapterSummary | null>(null);
  readonly savingBook = signal(false);
  readonly savingChapter = signal(false);
  readonly bookError = signal('');
  readonly bookSuccess = signal('');

  readonly genres = GENRES;
  readonly categories = CATEGORIES;

  chapterForm = this.fb.group({
    chapter_number: [1, [Validators.required, Validators.min(1)]],
    title: ['', Validators.required],
    content: ['', Validators.required],
    is_locked: [false],
    price_coins: [null as number | null],
  });

  readonly bookForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
    genre: ['', Validators.required],
    category: ['', Validators.required],
    tagsInput: [''],
    status: ['draft'],
  });

  ngOnInit(): void {
    if (this.bookId()) {
      this.bookService.getBook(this.bookId()!).subscribe(b => {
        this.bookForm.patchValue({
          title: b.title,
          description: b.description ?? '',
          genre: b.genre,
          category: b.category,
          tagsInput: b.tags.join(', '),
          status: b.status,
        });
      });
      this.loadChapters();
    }
  }

  loadChapters(): void {
    if (!this.bookId()) return;
    this.bookService.getChapters(this.bookId()!).subscribe(chs => this.chapters.set(chs));
  }

  saveBook(): void {
    if (this.bookForm.invalid) return;
    this.savingBook.set(true);
    this.bookError.set('');

    const { title, description, genre, category, tagsInput, status } = this.bookForm.value;
    const tags = (tagsInput ?? '').split(',').map(t => t.trim()).filter(Boolean);
    const payload = { title: title!, description: description ?? undefined, genre: genre! as Genre, category: category! as Category, tags, status: status! as BookStatus };

    const obs = this.bookId()
      ? this.bookService.updateBook(this.bookId()!, payload)
      : this.bookService.createBook(payload);

    obs.subscribe({
      next: b => {
        this.bookSuccess.set(this.bookId() ? '¡Libro actualizado!' : '¡Libro creado!');
        this.savingBook.set(false);
        if (!this.bookId()) this.router.navigate(['/writer/edit', b.id]);
        setTimeout(() => this.bookSuccess.set(''), 3000);
      },
      error: err => { this.bookError.set(err.message); this.savingBook.set(false); },
    });
  }

  selectChapter(ch: ChapterSummary): void {
    this.editingChapter.set(ch);
    this.bookService.getChapter(ch.id).subscribe(full => {
      this.chapterForm.patchValue({
        chapter_number: full.chapter_number,
        title: full.title,
        content: full.content,
        is_locked: full.is_locked,
        price_coins: full.price_coins,
      });
    });
  }

  newChapter(): void {
    this.editingChapter.set(null);
    this.chapterForm.reset({ chapter_number: this.chapters().length + 1, is_locked: false });
  }

  clearChapterForm(): void {
    this.editingChapter.set(null);
    this.chapterForm.reset();
  }

  saveChapter(): void {
    if (this.chapterForm.invalid || !this.bookId()) return;
    this.savingChapter.set(true);

    const v = this.chapterForm.value;
    const payload = {
      chapter_number: v.chapter_number!,
      title: v.title!,
      content: v.content!,
      is_locked: v.is_locked ?? false,
      price_coins: v.is_locked ? (v.price_coins ?? undefined) : undefined,
    };

    const obs = this.editingChapter()
      ? this.bookService.updateChapter(this.editingChapter()!.id, payload)
      : this.bookService.createChapter(this.bookId()!, payload);

    obs.subscribe({
      next: () => { this.loadChapters(); this.clearChapterForm(); this.savingChapter.set(false); },
      error: () => this.savingChapter.set(false),
    });
  }

  deleteChapter(e: Event, id: string): void {
    e.stopPropagation();
    if (!confirm('¿Eliminar este capítulo?')) return;
    this.bookService.deleteChapter(id).subscribe(() => this.loadChapters());
  }

  tabClass(tab: string): string {
    const active = 'border-b-2 border-purple-600 text-purple-600 font-semibold pb-3 px-2';
    const inactive = 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 pb-3 px-2 transition-colors';
    return this.activeTab() === tab ? active : inactive;
  }
}

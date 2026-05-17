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
  { value: 'nsfw',               label: 'NSFW (18+)' },
];

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, SpinnerComponent],
  template: `
    <div class="p-4 sm:p-6 max-w-5xl mx-auto">
      <!-- Tabs -->
      <div class="flex gap-2 sm:gap-4 mb-6 border-b border-ink-10 overflow-x-auto no-scrollbar">
        <button [class]="tabClass('book')" (click)="activeTab.set('book')">
          Info del libro
        </button>
        <button [class]="tabClass('chapters')" (click)="activeTab.set('chapters')" [disabled]="!bookId()">
          Capítulos {{ bookId() ? '(' + chapters().length + ')' : '' }}
        </button>
      </div>

      <!-- Tab: Info del libro -->
      @if (activeTab() === 'book') {
        <div class="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">

          <!-- Portada -->
          <div class="flex-shrink-0 flex flex-col items-center gap-2 w-full sm:w-auto">
            <input #coverInput type="file" accept="image/*" class="hidden" (change)="onCoverSelected($event)" />
            <button type="button"
              (click)="coverInput.click()"
              class="w-40 h-56 rounded-xl border-2 border-dashed border-ink-20 overflow-hidden bg-ink-5
                     hover:border-ink-20 transition-colors flex flex-col items-center justify-center group relative"
              aria-label="Subir portada del libro">
              @if (coverPreview()) {
                <img [src]="coverPreview()!" class="w-full h-full object-cover" alt="Portada" />
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity
                            flex items-center justify-center">
                  <span class="text-white text-xs font-medium">Cambiar portada</span>
                </div>
              } @else {
                <svg class="w-8 h-8 text-ink-20 group-hover:text-ink-20 transition-colors mb-2"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-xs text-ink-40 text-center px-2 leading-snug">Agregar una portada</span>
              }
            </button>
            @if (uploadingCover()) {
              <p class="text-xs text-ink-60 flex items-center gap-1"><app-spinner size="sm" /> Subiendo...</p>
            } @else if (coverPreview() && bookId()) {
              <p class="text-xs font-medium" style="color: #C46B1E;">Portada guardada</p>
            } @else if (coverPreview() && !bookId()) {
              <p class="text-xs text-amber-600 text-center">Se subirá al crear el libro</p>
            }
            <p class="text-xs text-ink-40 text-center">JPG, PNG · Máx. 5 MB</p>
          </div>

          <!-- Formulario -->
          <form [formGroup]="bookForm" (ngSubmit)="saveBook()" class="flex-1 space-y-5">
            <div class="grid md:grid-cols-2 gap-5">
              <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-ink-60 mb-2">Título del libro *</label>
                <input formControlName="title" type="text" class="input-field" placeholder="El nombre de tu obra..." />
              </div>
              <div>
                <label class="block text-sm font-semibold text-ink-60 mb-2">Género *</label>
                <select formControlName="genre" class="input-field">
                  <option value="">Selecciona un género</option>
                  @for (g of genres; track g) { <option [value]="g">{{ g }}</option> }
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-ink-60 mb-2">Categoría *</label>
                <select formControlName="category" class="input-field">
                  <option value="">Selecciona una categoría</option>
                  @for (c of categories; track c.value) { <option [value]="c.value">{{ c.label }}</option> }
                </select>
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-ink-60 mb-2">Descripción</label>
                <textarea formControlName="description" rows="4"
                  placeholder="La sinopsis de tu libro..."
                  class="input-field resize-none"></textarea>
              </div>
              <div>
                <label class="block text-sm font-semibold text-ink-60 mb-2">Etiquetas (separadas por coma)</label>
                <input formControlName="tagsInput" type="text" class="input-field" placeholder="magia, aventura, épico..." />
              </div>
              <div>
                <label class="block text-sm font-semibold text-ink-60 mb-2">Estado</label>
                <select formControlName="status" class="input-field">
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                  <option value="completed">Completado</option>
                </select>
              </div>
            </div>

            @if (bookError()) {
              <div class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl" role="alert">
                {{ bookError() }}
              </div>
            }
            @if (bookSuccess()) {
              <div class="text-sm px-4 py-3 rounded-xl border"
                   style="background-color: rgba(196,107,30,0.06); border-color: rgba(196,107,30,0.2); color: #C46B1E;"
                   role="status">
                {{ bookSuccess() }}
              </div>
            }

            <div class="flex gap-3">
              <button type="submit" class="btn-primary" [disabled]="savingBook() || bookForm.invalid">
                @if (savingBook()) { <app-spinner size="sm" /> }
                @else { {{ bookId() ? 'Actualizar libro' : 'Crear libro' }} }
              </button>
              @if (bookId()) {
                <button type="button" class="btn-secondary" (click)="activeTab.set('chapters')">
                  Ver capítulos
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              }
            </div>
          </form>
        </div>
      }

      <!-- Tab: Capítulos -->
      @if (activeTab() === 'chapters') {
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Lista de capítulos -->
          <div>
            <h2 class="mb-4">Capítulos</h2>
            @if (chapters().length === 0) {
              <div class="bg-white rounded-xl border border-ink-10 p-6 text-center text-ink-40">
                <svg class="w-10 h-10 text-ink-20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Aún no hay capítulos</p>
              </div>
            } @else {
              <div class="space-y-2">
                @for (ch of chapters(); track ch.id) {
                  <div class="bg-white rounded-md border p-3 flex items-center gap-3 cursor-pointer
                              hover:border-ink-20 transition-colors duration-150"
                       [class.border-ink]="editingChapter()?.id === ch.id"
                       [class.border-ink-10]="editingChapter()?.id !== ch.id"
                       (click)="selectChapter(ch)">
                    <span class="text-base font-bold text-ink-20 w-6 text-center flex-shrink-0 tabular-nums">
                      {{ ch.chapter_number }}
                    </span>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-sm text-ink-60 truncate">{{ ch.title }}</p>
                      <p class="text-xs text-ink-40 flex items-center gap-2 mt-0.5">
                        @if (ch.is_locked) {
                          <span class="flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            {{ ch.price_coins }} coins
                          </span>
                        }
                        <span class="flex items-center gap-1">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                          </svg>
                          {{ ch.views_count }}
                        </span>
                      </p>
                    </div>
                    <button (click)="deleteChapter($event, ch.id)"
                            class="text-ink-20 hover:text-red-500 transition-colors p-1 rounded"
                            [attr.aria-label]="'Eliminar capítulo ' + ch.chapter_number">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                }
              </div>
            }
            <button class="btn-secondary w-full mt-3 text-sm" (click)="newChapter()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo capítulo
            </button>
          </div>

          <!-- Editor de capítulo -->
          @if (chapterForm) {
            <div class="bg-white rounded-xl border border-ink-10 p-4">
              <h3 class="mb-4">
                {{ editingChapter() ? 'Editar capítulo ' + editingChapter()!.chapter_number : 'Nuevo capítulo' }}
              </h3>
              <form [formGroup]="chapterForm" (ngSubmit)="saveChapter()" class="space-y-3">
                <div class="flex gap-3">
                  <div class="w-24">
                    <label class="text-xs text-ink-40 font-semibold mb-1 block">Nro.</label>
                    <input formControlName="chapter_number" type="number" class="input-field text-sm" min="1" />
                  </div>
                  <div class="flex-1">
                    <label class="text-xs text-ink-40 font-semibold mb-1 block">Título</label>
                    <input formControlName="title" type="text" class="input-field text-sm" />
                  </div>
                </div>
                <div>
                  <label class="text-xs text-ink-40 font-semibold mb-1 block">Contenido</label>
                  <textarea formControlName="content" rows="10" class="input-field text-sm resize-none font-mono"></textarea>
                </div>
                <div class="flex items-center gap-3">
                  <label class="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" formControlName="is_locked"
                           class="rounded border-ink-10 text-amber" />
                    <span class="text-sm text-ink-60 flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Bloqueado
                    </span>
                  </label>
                  @if (chapterForm.get('is_locked')?.value) {
                    <div class="flex items-center gap-2">
                      <input formControlName="price_coins" type="number" min="1"
                        class="input-field text-sm w-24" placeholder="Coins" />
                      <span class="text-xs text-ink-40">monedas</span>
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
  readonly uploadingCover = signal(false);
  readonly bookError = signal('');
  readonly bookSuccess = signal('');
  readonly coverPreview = signal<string | null>(null);

  private pendingCoverFile: File | null = null;

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
        if (b.cover_url) this.coverPreview.set(b.cover_url);
      });
      this.loadChapters();
    }
  }

  onCoverSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => this.coverPreview.set(reader.result as string);
    reader.readAsDataURL(file);

    if (this.bookId()) {
      this.uploadCoverFile(file);
    } else {
      this.pendingCoverFile = file;
    }
  }

  private uploadCoverFile(file: File): void {
    this.uploadingCover.set(true);
    this.bookService.uploadCover(this.bookId()!, file).subscribe({
      next: res => { this.coverPreview.set(res.cover_url); this.uploadingCover.set(false); },
      error: () => this.uploadingCover.set(false),
    });
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
        this.savingBook.set(false);
        this.bookSuccess.set(this.bookId() ? '¡Libro actualizado!' : '¡Libro creado!');
        setTimeout(() => this.bookSuccess.set(''), 3000);
        if (!this.bookId()) {
          if (this.pendingCoverFile) {
            this.bookService.uploadCover(b.id, this.pendingCoverFile).subscribe(res => {
              this.coverPreview.set(res.cover_url);
              this.pendingCoverFile = null;
            });
          }
          this.router.navigate(['/writer/edit', b.id]);
        }
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
    const active = 'border-b-2 border-ink text-ink font-semibold pb-3 px-2 text-sm';
    const inactive = 'border-b-2 border-transparent text-ink-40 hover:text-ink-60 pb-3 px-2 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed';
    return this.activeTab() === tab ? active : inactive;
  }
}

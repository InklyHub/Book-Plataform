import { Component, inject, signal, OnInit, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { Quiz, QuizQuestion, QuizResult } from '../../../core/models';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

interface Answer {
  question_id: string;
  option_id: string;
}

@Component({
  selector: 'app-quiz-player',
  standalone: true,
  imports: [RouterLink, SpinnerComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      @if (loading()) {
        <app-spinner size="lg" />
      } @else {
        @if (result(); as r) {
        <!-- Resultado final -->
        <div class="card p-8 max-w-md w-full text-center animate-fade-in">
          <div class="text-6xl mb-4">{{ scoreEmoji(r.score) }}</div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ r.score }}%</h1>
          <p class="text-gray-500 mb-2">
            {{ r.correct_count }} de {{ r.total_questions }} respuestas correctas
          </p>
          <div class="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
            <div class="h-3 rounded-full transition-all duration-700"
              [class]="scoreBarColor(r.score)"
              [style.width.%]="r.score"></div>
          </div>
          <p class="text-lg font-semibold text-gray-700 mb-6">{{ scoreMessage(r.score) }}</p>
          <div class="flex gap-3 justify-center">
            <button (click)="restart()" class="btn-secondary">🔄 Reintentar</button>
            <a [routerLink]="['/book', quiz()!.book_id]" class="btn-primary">← Volver al libro</a>
          </div>
        </div>
        } @else {
        @if (quiz(); as q) {
        <!-- Quiz en curso -->
        <div class="w-full max-w-2xl animate-fade-in">
          <!-- Header -->
          <div class="card p-5 mb-4">
            <div class="flex items-center justify-between mb-3">
              <h1 class="font-bold text-xl text-gray-900">{{ q.title }}</h1>
              <span class="badge-purple">{{ currentIndex() + 1 }} / {{ q.questions.length }}</span>
            </div>
            <!-- Barra de progreso -->
            <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div class="h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                [style.width.%]="progress()"></div>
            </div>
          </div>

          <!-- Pregunta -->
          @if (currentQuestion(); as cq) {
            <div class="card p-6 mb-4">
              <p class="text-lg font-semibold text-gray-900 mb-5 leading-relaxed">
                {{ cq.question }}
              </p>

              <div class="space-y-3">
                @for (opt of cq.options; track opt.id) {
                  <button type="button"
                    (click)="selectOption(cq.id, opt.id)"
                    [class]="'w-full text-left px-5 py-4 rounded-xl border-2 transition-all font-medium ' +
                             optionClass(cq.id, opt.id)">
                    <span class="flex items-center gap-3">
                      <span class="w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-sm"
                        [class]="optionCircleClass(cq.id, opt.id)">
                        {{ optionLetter(cq.options.indexOf(opt)) }}
                      </span>
                      {{ opt.text }}
                    </span>
                  </button>
                }
              </div>
            </div>

            <!-- Navegación -->
            <div class="flex justify-between items-center">
              <button class="btn-secondary" [disabled]="currentIndex() === 0"
                (click)="prevQuestion()">
                ← Anterior
              </button>

              @if (currentIndex() < q.questions.length - 1) {
                <button class="btn-primary"
                  [disabled]="!hasAnswered(cq.id)"
                  (click)="nextQuestion()">
                  Siguiente →
                </button>
              } @else {
                <button class="btn-primary"
                  [disabled]="!canSubmit() || submitting()"
                  (click)="submitQuiz()">
                  @if (submitting()) { <app-spinner size="sm" /> } @else { Enviar respuestas ✓ }
                </button>
              }
            </div>

            <!-- Mini mapa de respuestas -->
            <div class="flex gap-1.5 flex-wrap justify-center mt-5">
              @for (qItem of q.questions; track qItem.id; let i = $index) {
                <button
                  (click)="currentIndex.set(i)"
                  [class]="'w-8 h-8 rounded-lg text-xs font-bold transition-all ' +
                           (i === currentIndex()
                             ? 'bg-purple-600 text-white scale-110'
                             : hasAnswered(qItem.id)
                               ? 'bg-green-100 text-green-700 border border-green-200'
                               : 'bg-white border border-gray-200 text-gray-500')">
                  {{ i + 1 }}
                </button>
              }
            </div>
          }
        </div>
        }
        }
      }
    </div>
  `,
})
export class QuizPlayerComponent implements OnInit {
  readonly quizId = input.required<string>();

  private readonly bookService = inject(BookService);

  readonly quiz = signal<Quiz | null>(null);
  readonly result = signal<QuizResult | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly currentIndex = signal(0);
  readonly answers = signal<Answer[]>([]);

  readonly currentQuestion = computed<QuizQuestion | null>(() => {
    const q = this.quiz();
    return q ? q.questions[this.currentIndex()] : null;
  });

  readonly progress = computed(() => {
    const q = this.quiz();
    if (!q) return 0;
    return ((this.currentIndex() + 1) / q.questions.length) * 100;
  });

  readonly canSubmit = computed(() => {
    const q = this.quiz();
    if (!q) return false;
    return q.questions.every(question => this.hasAnswered(question.id));
  });

  ngOnInit(): void {
    this.bookService.getQuiz(this.quizId()).subscribe({
      next: q => { this.quiz.set(q); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  selectOption(questionId: string, optionId: string): void {
    this.answers.update(ans => {
      const existing = ans.findIndex(a => a.question_id === questionId);
      if (existing >= 0) {
        const updated = [...ans];
        updated[existing] = { question_id: questionId, option_id: optionId };
        return updated;
      }
      return [...ans, { question_id: questionId, option_id: optionId }];
    });
  }

  hasAnswered(questionId: string): boolean {
    return this.answers().some(a => a.question_id === questionId);
  }

  getAnswer(questionId: string): string | null {
    return this.answers().find(a => a.question_id === questionId)?.option_id ?? null;
  }

  optionClass(questionId: string, optionId: string): string {
    const selected = this.getAnswer(questionId) === optionId;
    if (selected) return 'border-purple-500 bg-purple-50 text-purple-800';
    return 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50/40';
  }

  optionCircleClass(questionId: string, optionId: string): string {
    return this.getAnswer(questionId) === optionId
      ? 'border-purple-500 bg-purple-500 text-white'
      : 'border-gray-300 text-gray-400';
  }

  optionLetter(index: number): string {
    return ['A', 'B', 'C', 'D', 'E'][index] ?? String(index + 1);
  }

  submitQuiz(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.bookService.submitQuiz(this.quizId(), this.answers()).subscribe({
      next: r => { this.result.set(r); this.submitting.set(false); },
      error: () => this.submitting.set(false),
    });
  }

  prevQuestion(): void { this.currentIndex.update(i => i - 1); }
  nextQuestion(): void { this.currentIndex.update(i => i + 1); }

  restart(): void {
    this.result.set(null);
    this.answers.set([]);
    this.currentIndex.set(0);
  }

  scoreEmoji(score: number): string {
    if (score >= 90) return '🏆';
    if (score >= 70) return '🎉';
    if (score >= 50) return '👍';
    return '📚';
  }

  scoreMessage(score: number): string {
    if (score >= 90) return '¡Excelente! Eres un experto en este libro.';
    if (score >= 70) return '¡Muy bien! Tienes un buen dominio del contenido.';
    if (score >= 50) return 'No está mal, pero puedes mejorar.';
    return 'Sigue leyendo y vuelve a intentarlo.';
  }

  scoreBarColor(score: number): string {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }
}

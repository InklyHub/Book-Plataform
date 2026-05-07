import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Book, ChapterSummary, Chapter, Comment, PaginatedResponse, LibraryItem, BookAnalytics, QuizSummary, Quiz, QuizResult } from '../models';

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly api = inject(ApiService);

  // ── Books ──────────────────────────────────────────────────────────────────

  getBooks(params: {
    category?: string;
    genre?: string;
    q?: string;
    page?: number;
    size?: number;
  } = {}): Observable<PaginatedResponse<Book>> {
    return this.api.get<PaginatedResponse<Book>>('/books', params as any);
  }

  getBook(id: string): Observable<Book> {
    return this.api.get<Book>(`/books/${id}`);
  }

  createBook(data: {
    title: string;
    description?: string;
    genre: string;
    category: string;
    age_restriction?: string;
    tags?: string[];
  }): Observable<Book> {
    return this.api.post<Book>('/books', data);
  }

  updateBook(id: string, data: Partial<Book> & { tags?: string[] }): Observable<Book> {
    return this.api.patch<Book>(`/books/${id}`, data);
  }

  deleteBook(id: string): Observable<void> {
    return this.api.delete<void>(`/books/${id}`);
  }

  rateBook(id: string, score: number): Observable<{ rating_avg: number; rating_count: number }> {
    return this.api.post(`/books/${id}/rate`, { score });
  }

  // ── Chapters ───────────────────────────────────────────────────────────────

  getChapters(bookId: string): Observable<ChapterSummary[]> {
    return this.api.get<ChapterSummary[]>(`/chapters/book/${bookId}`);
  }

  getChapter(chapterId: string): Observable<Chapter> {
    return this.api.get<Chapter>(`/chapters/${chapterId}`);
  }

  createChapter(bookId: string, data: {
    chapter_number: number;
    title: string;
    content: string;
    is_locked?: boolean;
    price_coins?: number;
  }): Observable<Chapter> {
    return this.api.post<Chapter>(`/chapters/book/${bookId}`, data);
  }

  updateChapter(chapterId: string, data: Partial<Chapter>): Observable<Chapter> {
    return this.api.patch<Chapter>(`/chapters/${chapterId}`, data);
  }

  deleteChapter(chapterId: string): Observable<void> {
    return this.api.delete<void>(`/chapters/${chapterId}`);
  }

  toggleLike(chapterId: string): Observable<{ liked: boolean; likes_count: number }> {
    return this.api.post(`/chapters/${chapterId}/like`);
  }

  saveProgress(chapterId: string, scroll_percent: number, completed = false): Observable<any> {
    return this.api.post(`/chapters/${chapterId}/progress`, { scroll_percent, completed });
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  getComments(chapterId: string, page = 1): Observable<Comment[]> {
    return this.api.get<Comment[]>(`/comments/chapter/${chapterId}`, { page });
  }

  addComment(chapterId: string, text: string, parent_id?: string): Observable<Comment> {
    return this.api.post<Comment>(`/comments/chapter/${chapterId}`, { text, parent_id });
  }

  deleteComment(commentId: string): Observable<void> {
    return this.api.delete<void>(`/comments/${commentId}`);
  }

  // ── Library ────────────────────────────────────────────────────────────────

  getLibrary(status?: string): Observable<LibraryItem[]> {
    return this.api.get<LibraryItem[]>('/library', status ? { lib_status: status } : {});
  }

  addToLibrary(book_id: string, status = 'reading'): Observable<any> {
    return this.api.post('/library', { book_id, status });
  }

  updateLibraryStatus(bookId: string, status: string): Observable<any> {
    return this.api.patch(`/library/${bookId}`, { status });
  }

  removeFromLibrary(bookId: string): Observable<void> {
    return this.api.delete<void>(`/library/${bookId}`);
  }

  // ── Writer ─────────────────────────────────────────────────────────────────

  getMyBooks(): Observable<Book[]> {
    return this.api.get<Book[]>('/writer/books');
  }

  getAnalytics(bookId: string): Observable<BookAnalytics> {
    return this.api.get<BookAnalytics>(`/writer/analytics/${bookId}`);
  }

  // ── Quizzes ────────────────────────────────────────────────────────────────

  getQuizzes(bookId: string): Observable<QuizSummary[]> {
    return this.api.get<QuizSummary[]>(`/quizzes/book/${bookId}`);
  }

  getQuiz(quizId: string): Observable<Quiz> {
    return this.api.get<Quiz>(`/quizzes/${quizId}`);
  }

  submitQuiz(quizId: string, answers: { question_id: string; option_id: string }[]): Observable<QuizResult> {
    return this.api.post<QuizResult>(`/quizzes/${quizId}/submit`, { answers });
  }
}

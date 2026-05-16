import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { writerGuard } from './core/guards/writer.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Auth (solo si no estás logueado)
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./features/auth/genre-selection/genre-selection.component').then(m => m.GenreSelectionComponent),
    canActivate: [authGuard],
  },

  // Reader (layout con sidebar)
  {
    path: '',
    loadComponent: () => import('./features/reader/layout/reader-layout.component').then(m => m.ReaderLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./features/reader/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'library',
        loadComponent: () => import('./features/reader/library/library.component').then(m => m.LibraryComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/reader/profile/profile.component').then(m => m.ProfileComponent),
      },
    ],
  },

  // Detalle de libro y lector
  {
    path: 'book/:id',
    loadComponent: () => import('./features/reader/book-detail/book-detail.component').then(m => m.BookDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: 'read/:bookId/:chapterId',
    loadComponent: () => import('./features/reader/book-reader/book-reader.component').then(m => m.BookReaderComponent),
    canActivate: [authGuard],
  },

  // Quiz
  {
    path: 'quiz/:quizId',
    loadComponent: () => import('./features/quizzes/quiz-player/quiz-player.component').then(m => m.QuizPlayerComponent),
    canActivate: [authGuard],
  },

  // Writer (layout propio)
  {
    path: 'writer',
    loadComponent: () => import('./features/writer/layout/writer-layout.component').then(m => m.WriterLayoutComponent),
    canActivate: [authGuard, writerGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/writer/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'new',
        loadComponent: () => import('./features/writer/editor/editor.component').then(m => m.EditorComponent),
      },
      {
        path: 'edit/:bookId',
        loadComponent: () => import('./features/writer/editor/editor.component').then(m => m.EditorComponent),
      },
      {
        path: 'analytics/:bookId',
        loadComponent: () => import('./features/writer/analytics/analytics.component').then(m => m.AnalyticsComponent),
      },
      {
        path: 'monetize/:bookId',
        loadComponent: () => import('./features/writer/monetization/monetization.component').then(m => m.MonetizationComponent),
      },
    ],
  },

  { path: '**', redirectTo: 'home' },
];

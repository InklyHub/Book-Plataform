import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CoinBadgeComponent } from '../coin-badge/coin-badge.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CoinBadgeComponent],
  template: `
    <aside class="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-30 shadow-sm">
      <!-- Logo -->
      <div class="p-6 border-b border-gray-100">
        <a routerLink="/home" class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span class="font-bold text-gray-900 text-lg">Inkly</span>
        </a>
      </div>

      <!-- Nav lector (role 0 o 2) -->
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        @if (auth.isReader()) {
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Lector</p>
          @for (link of readerLinks; track link.path) {
            <a [routerLink]="link.path" routerLinkActive="active" class="sidebar-link">
              <span class="text-lg">{{ link.icon }}</span>
              <span>{{ link.label }}</span>
            </a>
          }
        }

        <!-- Nav escritor (role 1 o 2) -->
        @if (auth.isWriter()) {
          <div class="pt-4 mt-4 border-t border-gray-100">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Escritor</p>
            @for (link of writerLinks; track link.path) {
              <a [routerLink]="link.path" routerLinkActive="active" class="sidebar-link">
                <span class="text-lg">{{ link.icon }}</span>
                <span>{{ link.label }}</span>
              </a>
            }
          </div>
        }

        <!-- Botón activar escritor (solo lector, role=0) -->
        @if (auth.isReader() && !auth.isWriter()) {
          <div class="pt-4 mt-4 border-t border-gray-100">
            <button
              (click)="activateWriter()"
              [disabled]="switching()"
              class="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 text-sm font-medium hover:bg-purple-50 transition-all disabled:opacity-50">
              <span class="text-lg">✍️</span>
              {{ switching() ? 'Activando...' : 'Crear cuenta escritor' }}
            </button>
          </div>
        }

        <!-- Botón activar lector (solo escritor, role=1) -->
        @if (auth.isWriter() && !auth.isReader()) {
          <div class="pt-4 mt-4 border-t border-gray-100">
            <button
              (click)="activateReader()"
              [disabled]="switching()"
              class="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-all disabled:opacity-50">
              <span class="text-lg">📖</span>
              {{ switching() ? 'Activando...' : 'Crear cuenta lector' }}
            </button>
          </div>
        }
      </nav>

      <!-- Usuario -->
      <div class="p-4 border-t border-gray-100">
        @if (auth.user(); as user) {
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {{ user.username[0].toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ user.username }}</p>
              <app-coin-badge [amount]="auth.coins()" />
            </div>
          </div>
        }
        <button (click)="auth.logout()" class="btn-ghost w-full text-sm text-gray-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  readonly switching = signal(false);

  readonly readerLinks = [
    { path: '/home',    label: 'Inicio',     icon: '🏠' },
    { path: '/library', label: 'Biblioteca', icon: '📚' },
    { path: '/profile', label: 'Perfil',     icon: '👤' },
  ];

  readonly writerLinks = [
    { path: '/writer',     label: 'Mis libros',  icon: '📝' },
    { path: '/writer/new', label: 'Nuevo libro',  icon: '➕' },
  ];

  activateWriter(): void {
    this.switching.set(true);
    this.auth.switchRole().subscribe({
      next: () => { this.switching.set(false); this.router.navigate(['/writer']); },
      error: () => this.switching.set(false),
    });
  }

  activateReader(): void {
    this.switching.set(true);
    this.auth.switchRole().subscribe({
      next: () => { this.switching.set(false); this.router.navigate(['/home']); },
      error: () => this.switching.set(false),
    });
  }
}

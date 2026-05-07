import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CoinBadgeComponent } from '../../../shared/components/coin-badge/coin-badge.component';

@Component({
  selector: 'app-writer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CoinBadgeComponent],
  template: `
    <div class="flex min-h-screen bg-gray-50">
      <!-- Sidebar escritor -->
      <aside class="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-30 shadow-sm">
        <div class="p-6 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <span class="text-white text-lg">✍️</span>
            </div>
            <div>
              <p class="font-bold text-gray-900 text-sm">Panel Escritor</p>
              <p class="text-xs text-gray-400">{{ auth.user()?.username }}</p>
            </div>
          </div>
        </div>

        <nav class="flex-1 p-4 space-y-1">
          <a routerLink="/writer" [routerLinkActiveOptions]="{exact: true}" routerLinkActive="active" class="sidebar-link">
            📊 Mis libros
          </a>
          <a routerLink="/writer/new" routerLinkActive="active" class="sidebar-link">
            ➕ Nuevo libro
          </a>
          <div class="pt-4 mt-4 border-t border-gray-100">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Lector</p>
            <a routerLink="/home" class="sidebar-link">🏠 Ir a inicio</a>
          </div>
        </nav>

        <div class="p-4 border-t border-gray-100">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold">
              {{ auth.user()?.username?.[0]?.toUpperCase() }}
            </div>
            <app-coin-badge [amount]="auth.coins()" />
          </div>
          <button (click)="auth.logout()" class="btn-ghost w-full text-sm text-gray-500">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main class="flex-1 ml-64">
        <router-outlet />
      </main>
    </div>
  `,
})
export class WriterLayoutComponent {
  readonly auth = inject(AuthService);
}

import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-writer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SidebarComponent],
  template: `
    <div class="flex min-h-screen bg-gray-50">
      <app-sidebar />
      <main class="flex-1 min-w-0 md:ml-64 min-h-screen pb-16 md:pb-0">
        <router-outlet />
      </main>
    </div>

    <!-- Barra de navegación inferior — solo móvil -->
    <nav class="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-40 flex">
      <a routerLink="/writer" [routerLinkActiveOptions]="{exact:true}" routerLinkActive="text-purple-600 bg-purple-50"
        class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-500 transition-colors min-h-[56px]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="text-[10px] font-medium">Mis libros</span>
      </a>

      <a routerLink="/writer/new" routerLinkActive="text-purple-600 bg-purple-50"
        class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-500 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span class="text-[10px] font-medium">Nuevo</span>
      </a>

      @if (auth.isReader()) {
        <a routerLink="/home"
          class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-500 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span class="text-[10px] font-medium">Lector</span>
        </a>
      }

      <a routerLink="/profile" routerLinkActive="text-purple-600 bg-purple-50"
        class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-500 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span class="text-[10px] font-medium">Perfil</span>
      </a>
    </nav>
  `,
})
export class WriterLayoutComponent {
  readonly auth = inject(AuthService);
}

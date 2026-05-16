import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reader-layout',
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
      <a routerLink="/home" routerLinkActive="text-purple-600 bg-purple-50"
        class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-500 transition-colors min-h-[56px]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span class="text-[10px] font-medium">Inicio</span>
      </a>

      <a routerLink="/library" routerLinkActive="text-purple-600 bg-purple-50"
        class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-500 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
        <span class="text-[10px] font-medium">Biblioteca</span>
      </a>

      @if (auth.isWriter()) {
        <a routerLink="/writer" routerLinkActive="text-purple-600 bg-purple-50"
          class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-500 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span class="text-[10px] font-medium">Escritor</span>
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
export class ReaderLayoutComponent {
  readonly auth = inject(AuthService);
}

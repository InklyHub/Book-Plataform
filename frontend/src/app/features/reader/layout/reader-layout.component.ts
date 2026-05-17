import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reader-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SidebarComponent],
  template: `
    <div class="flex min-h-screen" style="background-color: #FAF6F0;">
      <app-sidebar />
      <main class="flex-1 min-w-0 md:ml-60 min-h-screen pb-16 md:pb-0" id="main-content">
        <router-outlet />
      </main>
    </div>

    <!-- Barra de navegación inferior — solo móvil -->
    <nav class="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-ink-10"
         style="background-color: rgba(250,246,240,.92); backdrop-filter: blur(12px);"
         aria-label="Navegación móvil">

      <a routerLink="/home" routerLinkActive="active-nav"
        class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-ink-40
               transition-colors min-h-[56px]"
        aria-label="Inicio">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span class="text-[10px] font-medium">Inicio</span>
      </a>

      <a routerLink="/library" routerLinkActive="active-nav"
        class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-ink-40 transition-colors"
        aria-label="Biblioteca">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
        <span class="text-[10px] font-medium">Biblioteca</span>
      </a>

      @if (auth.isWriter()) {
        <a routerLink="/writer" routerLinkActive="active-nav"
          class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-ink-40 transition-colors"
          aria-label="Panel de escritor">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span class="text-[10px] font-medium">Escritor</span>
        </a>
      }

      <a routerLink="/profile" routerLinkActive="active-nav"
        class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-ink-40 transition-colors"
        aria-label="Mi perfil">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span class="text-[10px] font-medium">Perfil</span>
      </a>
    </nav>
  `,
  styles: [`
    .active-nav { color: #C46B1E !important; }
  `],
})
export class ReaderLayoutComponent {
  readonly auth = inject(AuthService);
}

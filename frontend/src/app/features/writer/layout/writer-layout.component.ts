import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-writer-layout',
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
         aria-label="Navegación de escritor">

      <a routerLink="/writer" [routerLinkActiveOptions]="{exact:true}" routerLinkActive="active-nav"
        class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-ink-40
               transition-colors min-h-[56px]"
        aria-label="Mis libros">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="text-[10px] font-medium">Mis libros</span>
      </a>

      <a routerLink="/writer/new" routerLinkActive="active-nav"
        class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-ink-40 transition-colors"
        aria-label="Nuevo libro">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span class="text-[10px] font-medium">Nuevo</span>
      </a>

      @if (auth.isReader()) {
        <a routerLink="/home"
          class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-ink-40 transition-colors"
          aria-label="Ir a modo lector">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span class="text-[10px] font-medium">Lector</span>
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
export class WriterLayoutComponent {
  readonly auth = inject(AuthService);
}

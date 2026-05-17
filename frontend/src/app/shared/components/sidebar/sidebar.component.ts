import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CoinBadgeComponent } from '../coin-badge/coin-badge.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CoinBadgeComponent],
  template: `
    <aside
      class="hidden md:flex fixed left-0 top-0 h-screen w-60 flex-col z-30"
      style="background-color: #1A1410;"
      role="navigation"
      aria-label="Navegación principal">

      <!-- Logo -->
      <div class="px-5 py-5 border-b border-white/[0.08]">
        <a routerLink="/home" class="flex items-center gap-2.5 group" aria-label="Inkly — ir al inicio">
          <div class="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
               style="background-color: #C46B1E;">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span style="font-family: 'Playfair Display', Georgia, serif; font-weight: 700;"
                class="text-white text-[17px] tracking-tight">Inkly</span>
        </a>
      </div>

      <!-- Navegación -->
      <nav class="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">

        @if (auth.isReader()) {
          <p class="text-[10px] font-bold uppercase tracking-widest px-3 mb-3 mt-1"
             style="color: #8C7B70;">Descubrir</p>

          <a routerLink="/home" routerLinkActive="active" class="sidebar-link">
            <svg class="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Inicio</span>
          </a>

          <a routerLink="/library" routerLinkActive="active" class="sidebar-link">
            <svg class="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            <span>Biblioteca</span>
          </a>

          <a routerLink="/profile" routerLinkActive="active" class="sidebar-link">
            <svg class="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Mi perfil</span>
          </a>
        }

        @if (auth.isWriter()) {
          <div class="pt-4 mt-4 border-t border-white/[0.08]">
            <p class="text-[10px] font-bold uppercase tracking-widest px-3 mb-3"
               style="color: #8C7B70;">Escritor</p>

            <a routerLink="/writer" [routerLinkActiveOptions]="{exact:true}" routerLinkActive="active" class="sidebar-link">
              <svg class="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Mis libros</span>
            </a>

            <a routerLink="/writer/new" routerLinkActive="active" class="sidebar-link">
              <svg class="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuevo libro</span>
            </a>
          </div>
        }

        <!-- Activar escritor -->
        @if (auth.isReader() && !auth.isWriter()) {
          <div class="pt-4 mt-4 border-t border-white/[0.08]">
            <button
              (click)="activateWriter()"
              [disabled]="switching()"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                     border border-dashed transition-colors duration-150
                     hover:border-[#C46B1E] hover:text-[#C46B1E]
                     disabled:opacity-40 disabled:cursor-not-allowed"
              style="border-color: #3A2F27; color: #8C7B70;">
              <svg class="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              {{ switching() ? 'Activando...' : 'Activar modo escritor' }}
            </button>
          </div>
        }

        <!-- Activar lector -->
        @if (auth.isWriter() && !auth.isReader()) {
          <div class="pt-4 mt-4 border-t border-white/[0.08]">
            <button
              (click)="activateReader()"
              [disabled]="switching()"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                     border border-dashed transition-colors duration-150
                     hover:border-[#C46B1E] hover:text-[#C46B1E]
                     disabled:opacity-40 disabled:cursor-not-allowed"
              style="border-color: #3A2F27; color: #8C7B70;">
              <svg class="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {{ switching() ? 'Activando...' : 'Activar modo lector' }}
            </button>
          </div>
        }
      </nav>

      <!-- Usuario -->
      <div class="px-3 py-4 border-t border-white/[0.08]">
        @if (auth.user(); as user) {
          <div class="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl hover:bg-white/5 transition-colors">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                 style="background: linear-gradient(135deg, #C46B1E 0%, #A8432B 100%);"
                 aria-hidden="true">
              {{ user.username[0].toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-white truncate leading-tight">{{ user.username }}</p>
              <app-coin-badge [amount]="auth.coins()" />
            </div>
          </div>
        }
        <button
          (click)="auth.logout()"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm
                 hover:text-white transition-colors duration-150"
          style="color: #8C7B70;"
          aria-label="Cerrar sesión">
          <svg class="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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

import { Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CoinBadgeComponent } from '../coin-badge/coin-badge.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, FormsModule, CoinBadgeComponent],
  template: `
    <header class="page-header h-14 px-4 md:px-6 flex items-center gap-4" role="banner">

      <!-- Búsqueda -->
      <div class="relative flex-1 max-w-md">
        <label for="global-search" class="sr-only">Buscar libros y autores</label>
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-40 pointer-events-none"
             fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
        </svg>
        <input
          id="global-search"
          type="search"
          [ngModel]="searchValue()"
          (ngModelChange)="searchChange.emit($event)"
          (keyup.enter)="search.emit(searchValue())"
          placeholder="Buscar libros, autores..."
          class="w-full h-10 pl-9 pr-4 rounded-full border-[1.5px] border-ink-10 bg-white
                 text-sm text-ink placeholder:text-ink-40
                 focus:outline-none focus:border-[#C46B1E] focus:ring-2 focus:ring-[rgba(196,107,30,.12)]
                 transition duration-150" />
      </div>

      <!-- Acciones -->
      <div class="flex items-center gap-2 ml-auto">

        @if (auth.isReader() && !auth.isWriter()) {
          <button
            (click)="activateWriter()"
            [disabled]="switching()"
            class="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-md
                   border border-ink-10 text-ink-60 bg-white
                   hover:bg-ink-5 hover:border-ink-40
                   transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            {{ switching() ? 'Activando...' : 'Modo escritor' }}
          </button>
        }

        @if (auth.isWriter() && !isWriterRoute()) {
          <a routerLink="/writer"
            class="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-md
                   border border-ink-10 text-ink-60 bg-white
                   hover:bg-ink-5 hover:border-ink-40 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Modo escritor
          </a>
        }

        @if (auth.isWriter() && !auth.isReader() && isWriterRoute()) {
          <button
            (click)="activateReader()"
            [disabled]="switching()"
            class="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-md
                   border border-ink-10 text-ink-60 bg-white
                   hover:bg-ink-5 hover:border-ink-40
                   transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {{ switching() ? 'Activando...' : 'Modo lector' }}
          </button>
        }

        @if (auth.isBoth() && isWriterRoute()) {
          <a routerLink="/home"
            class="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-md
                   border border-ink-10 text-ink-60 bg-white
                   hover:bg-ink-5 hover:border-ink-40 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Modo lector
          </a>
        }

        <app-coin-badge [amount]="auth.coins()" size="md" />
      </div>
    </header>
  `,
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  readonly searchValue = input<string>('');
  readonly searchChange = output<string>();
  readonly search = output<string>();
  readonly switching = signal(false);

  isWriterRoute(): boolean {
    return this.router.url.startsWith('/writer');
  }

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

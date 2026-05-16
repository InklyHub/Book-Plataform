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
    <header class="page-header px-4 md:px-6 h-16 flex items-center gap-4">
      <!-- Búsqueda -->
      <div class="relative flex-1 max-w-xl">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
        </svg>
        <input
          type="text"
          [ngModel]="searchValue()"
          (ngModelChange)="searchChange.emit($event)"
          (keyup.enter)="search.emit(searchValue())"
          placeholder="Buscar libros, autores..."
          class="input-field pl-9" />
      </div>

      <!-- Acciones -->
      <div class="flex items-center gap-3 ml-auto">

        <!-- Solo lector (role=0): "Crear cuenta escritor" la primera vez -->
        @if (auth.isReader() && !auth.isWriter()) {
          <button
            (click)="activateWriter()"
            [disabled]="switching()"
            class="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl border-2 border-purple-400 text-purple-600 hover:bg-purple-50 transition-all disabled:opacity-50">
            <span>✍️</span>
            {{ switching() ? '...' : 'Crear cuenta escritor' }}
          </button>
        }

        <!-- Tiene rol escritor (role=1 o 2) y está en zona lector: "Modo escritor" -->
        @if (auth.isWriter() && !isWriterRoute()) {
          <a routerLink="/writer"
            class="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl border-2 border-indigo-400 text-indigo-600 hover:bg-indigo-50 transition-all">
            <span>✍️</span> Modo escritor
          </a>
        }

        <!-- Solo escritor (role=1): "Crear cuenta lector" la primera vez, en zona escritor -->
        @if (auth.isWriter() && !auth.isReader() && isWriterRoute()) {
          <button
            (click)="activateReader()"
            [disabled]="switching()"
            class="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl border-2 border-blue-400 text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50">
            <span>📖</span>
            {{ switching() ? '...' : 'Crear cuenta lector' }}
          </button>
        }

        <!-- Ambos roles (role=2) en zona escritor: "Modo lector" -->
        @if (auth.isBoth() && isWriterRoute()) {
          <a routerLink="/home"
            class="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl border-2 border-blue-400 text-blue-600 hover:bg-blue-50 transition-all">
            <span>📖</span> Modo lector
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


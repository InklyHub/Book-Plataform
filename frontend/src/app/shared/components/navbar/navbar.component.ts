import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CoinBadgeComponent } from '../coin-badge/coin-badge.component';

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
        @if (auth.isWriter()) {
          <a routerLink="/writer" class="btn-secondary hidden sm:flex text-sm gap-1.5">
            <span>✍️</span> Panel escritor
          </a>
        }
        <app-coin-badge [amount]="auth.coins()" size="md" />
      </div>
    </header>
  `,
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  readonly searchValue = input<string>('');
  readonly searchChange = output<string>();
  readonly search = output<string>();
}

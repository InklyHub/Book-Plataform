import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { Achievement } from '../../../core/models';
import { CoinBadgeComponent } from '../../../shared/components/coin-badge/coin-badge.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, CoinBadgeComponent, SpinnerComponent],
  template: `
    <div class="p-6 max-w-4xl">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

      <div class="grid md:grid-cols-3 gap-6">
        <!-- Columna izquierda -->
        <div class="space-y-4">
          <!-- Avatar y stats -->
          <div class="card p-6 text-center">
            <div class="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
              {{ auth.user()?.username?.[0]?.toUpperCase() }}
            </div>
            <h2 class="font-bold text-xl text-gray-900">{{ auth.user()?.username }}</h2>
            <p class="text-gray-500 text-sm">{{ auth.user()?.email }}</p>
            <div class="mt-3">
              <app-coin-badge [amount]="auth.coins()" size="md" />
            </div>
          </div>

          <!-- Estadísticas -->
          @if (auth.user()?.reading_stats; as stats) {
            <div class="card p-4">
              <h3 class="font-semibold text-gray-800 mb-3">Estadísticas</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500 flex items-center gap-1.5">📖 Libros leídos</span>
                  <span class="font-semibold text-gray-900">{{ stats.books_read }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500 flex items-center gap-1.5">🔥 Racha</span>
                  <span class="font-semibold text-gray-900">{{ stats.reading_streak }} días</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500 flex items-center gap-1.5">⏱️ Tiempo</span>
                  <span class="font-semibold text-gray-900">{{ stats.reading_time_min | number }} min</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500 flex items-center gap-1.5">👥 Seguidores</span>
                  <span class="font-semibold text-gray-900">{{ stats.followers }}</span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Columna derecha -->
        <div class="md:col-span-2 space-y-4">
          <!-- Editar perfil -->
          <div class="card p-6">
            <h3 class="font-semibold text-gray-800 mb-4">Editar perfil</h3>
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre de usuario</label>
                <input formControlName="username" type="text" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Biografía</label>
                <textarea formControlName="bio" rows="3"
                  placeholder="Cuéntanos algo sobre ti..."
                  class="input-field resize-none"></textarea>
              </div>
              <div class="flex justify-end">
                <button type="submit" class="btn-primary" [disabled]="savingProfile()">
                  @if (savingProfile()) { <app-spinner size="sm" /> } @else { Guardar cambios }
                </button>
              </div>
              @if (profileMsg()) {
                <p class="text-green-600 text-sm text-center">{{ profileMsg() }}</p>
              }
            </form>
          </div>

          <!-- Logros -->
          <div class="card p-6">
            <h3 class="font-semibold text-gray-800 mb-4">Logros</h3>
            @if (loadingAchievements()) {
              <div class="flex justify-center py-8"><app-spinner /></div>
            } @else {
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                @for (a of achievements(); track a.id) {
                  <div [class]="'p-3 rounded-xl border text-center transition-all ' +
                               (a.earned ? 'border-purple-200 bg-purple-50' : 'border-gray-100 opacity-50')">
                    <div class="text-2xl mb-1">{{ a.earned ? '⭐' : '🔒' }}</div>
                    <p class="text-xs font-semibold text-gray-800">{{ a.title }}</p>
                    <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ a.description }}</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly achievements = signal<Achievement[]>([]);
  readonly loadingAchievements = signal(true);
  readonly savingProfile = signal(false);
  readonly profileMsg = signal('');

  readonly profileForm = this.fb.group({
    username: [this.auth.user()?.username ?? '', [Validators.required, Validators.minLength(3)]],
    bio: [this.auth.user()?.bio ?? ''],
  });

  ngOnInit(): void {
    this.api.get<Achievement[]>('/users/me/achievements').subscribe({
      next: a => { this.achievements.set(a); this.loadingAchievements.set(false); },
      error: () => this.loadingAchievements.set(false),
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile.set(true);
    this.auth.updateProfile(this.profileForm.value as any).subscribe({
      next: () => {
        this.profileMsg.set('Perfil actualizado correctamente');
        this.savingProfile.set(false);
        setTimeout(() => this.profileMsg.set(''), 3000);
      },
      error: () => this.savingProfile.set(false),
    });
  }
}

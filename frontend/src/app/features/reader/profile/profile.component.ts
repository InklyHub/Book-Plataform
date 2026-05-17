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
    <div class="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 class="mb-6">Mi perfil</h1>

      <div class="grid md:grid-cols-3 gap-5">

        <!-- Columna izquierda -->
        <div class="space-y-4">
          <!-- Avatar y datos -->
          <div class="bg-white rounded-xl border border-ink-10 p-6 text-center">
            <div class="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3"
                 style="background-color: #C46B1E;" aria-hidden="true">
              {{ auth.user()?.username?.[0]?.toUpperCase() }}
            </div>
            <h2 class="font-bold text-lg text-ink">{{ auth.user()?.username }}</h2>
            <p class="text-ink-40 text-sm mt-0.5">{{ auth.user()?.email }}</p>
            <div class="mt-3">
              <app-coin-badge [amount]="auth.coins()" size="md" />
            </div>
          </div>

          <!-- Estadísticas -->
          @if (auth.user()?.reading_stats; as stats) {
            <div class="bg-white rounded-xl border border-ink-10 p-4">
              <h3 class="mb-4">Estadísticas</h3>
              <dl class="space-y-3">
                <div class="flex items-center justify-between">
                  <dt class="text-sm text-ink-40 flex items-center gap-2">
                    <svg class="w-4 h-4 text-ink-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Libros leídos
                  </dt>
                  <dd class="font-semibold text-ink text-sm">{{ stats.books_read }}</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-sm text-ink-40 flex items-center gap-2">
                    <svg class="w-4 h-4 text-ink-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                    Racha actual
                  </dt>
                  <dd class="font-semibold text-ink text-sm">{{ stats.reading_streak }} días</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-sm text-ink-40 flex items-center gap-2">
                    <svg class="w-4 h-4 text-ink-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tiempo leyendo
                  </dt>
                  <dd class="font-semibold text-ink text-sm">{{ stats.reading_time_min | number }} min</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-sm text-ink-40 flex items-center gap-2">
                    <svg class="w-4 h-4 text-ink-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Seguidores
                  </dt>
                  <dd class="font-semibold text-ink text-sm">{{ stats.followers }}</dd>
                </div>
              </dl>
            </div>
          }
        </div>

        <!-- Columna derecha -->
        <div class="md:col-span-2 space-y-4">

          <!-- Editar perfil -->
          <div class="bg-white rounded-xl border border-ink-10 p-6">
            <h3 class="mb-5">Editar perfil</h3>
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-4" novalidate>
              <div>
                <label for="profile-username" class="block text-sm font-semibold text-ink-60 mb-2">
                  Nombre de usuario
                </label>
                <input id="profile-username" formControlName="username" type="text" class="input-field" />
              </div>
              <div>
                <label for="profile-bio" class="block text-sm font-semibold text-ink-60 mb-2">
                  Biografía
                </label>
                <textarea id="profile-bio" formControlName="bio" rows="3"
                  placeholder="Cuéntanos algo sobre ti..."
                  class="input-field resize-none"></textarea>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  @if (profileMsg()) {
                    <p class="text-sm font-medium" style="color: #C46B1E;" role="status">{{ profileMsg() }}</p>
                  }
                </div>
                <button type="submit" class="btn-primary" [disabled]="savingProfile()">
                  @if (savingProfile()) { <app-spinner size="sm" /> } @else { Guardar cambios }
                </button>
              </div>
            </form>
          </div>

          <!-- Logros -->
          <div class="bg-white rounded-xl border border-ink-10 p-6">
            <h3 class="mb-5">Logros</h3>
            @if (loadingAchievements()) {
              <div class="flex justify-center py-8"><app-spinner /></div>
            } @else {
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                @for (a of achievements(); track a.id) {
                  <div class="p-3.5 rounded-xl border text-center transition-all"
                       [class.border-ink-10]="a.earned"
                       [class.bg-amber-pale]="a.earned"
                       [class.border-ink-5]="!a.earned"
                       [class.bg-ink-5]="!a.earned"
                       [class.opacity-50]="!a.earned">
                    <div class="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
                         [style.background-color]="a.earned ? 'rgba(196,107,30,0.12)' : '#e8dfd6'">
                      <svg class="w-4 h-4"
                           [style.color]="a.earned ? '#C46B1E' : '#b8a99a'"
                           fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        @if (a.earned) {
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        } @else {
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        }
                      </svg>
                    </div>
                    <p class="text-xs font-semibold text-ink-60">{{ a.title }}</p>
                    <p class="text-xs text-ink-40 mt-0.5 line-clamp-2">{{ a.description }}</p>
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

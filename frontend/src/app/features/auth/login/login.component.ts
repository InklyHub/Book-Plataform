import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SpinnerComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div class="w-full max-w-md animate-fade-in">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 items-center justify-center mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900">Bienvenido de vuelta</h1>
          <p class="text-gray-500 mt-1">Continúa tu aventura lectora</p>
        </div>

        <!-- Card -->
        <div class="card p-8">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input formControlName="email" type="email" class="input-field"
                placeholder="tu@email.com" autocomplete="email" />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="text-red-500 text-xs mt-1">Email requerido y válido</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <input formControlName="password" type="password" class="input-field"
                placeholder="••••••••" autocomplete="current-password" />
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="text-red-500 text-xs mt-1">Contraseña requerida (mínimo 8 caracteres)</p>
              }
            </div>

            @if (error()) {
              <div class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {{ error() }}
              </div>
            }

            <button type="submit" class="btn-primary w-full" [disabled]="loading() || form.invalid">
              @if (loading()) { <app-spinner size="sm" /> } @else { Iniciar sesión }
            </button>
          </form>

          <p class="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?
            <a routerLink="/register" class="text-purple-600 font-medium hover:underline">Regístrate</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => {
        this.auth.loadProfile().subscribe(() => this.router.navigate(['/home']));
      },
      error: (err) => {
        this.error.set(err.message || 'Credenciales inválidas');
        this.loading.set(false);
      },
    });
  }
}

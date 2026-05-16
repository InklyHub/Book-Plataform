import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-register',
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
          <h1 class="text-3xl font-bold text-gray-900">Crea tu cuenta</h1>
          <p class="text-gray-500 mt-1">Únete a miles de lectores y escritores</p>
        </div>

        <div class="card p-8">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre de usuario</label>
              <input formControlName="username" type="text" class="input-field"
                placeholder="tu_nombre" autocomplete="username" />
              @if (form.get('username')?.invalid && form.get('username')?.touched) {
                <p class="text-red-500 text-xs mt-1">Mínimo 3 caracteres</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input formControlName="email" type="email" class="input-field"
                placeholder="tu@email.com" autocomplete="email" />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="text-red-500 text-xs mt-1">Email válido requerido</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <input formControlName="password" type="password" class="input-field"
                placeholder="Mínimo 8 caracteres" autocomplete="new-password" />
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="text-red-500 text-xs mt-1">Mínimo 8 caracteres</p>
              }
            </div>

            <!-- Tipo de cuenta -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">¿Eres...?</label>
              <div class="grid grid-cols-2 gap-3">
                @for (opt of roleOptions; track opt.value) {
                  <button type="button"
                    (click)="form.get('role')?.setValue(opt.value)"
                    [class]="'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ' +
                             (form.get('role')?.value === opt.value
                               ? 'border-purple-500 bg-purple-50 text-purple-700'
                               : 'border-gray-200 text-gray-600 hover:border-gray-300')">
                    <span class="text-2xl">{{ opt.icon }}</span>
                    <span class="text-sm font-medium">{{ opt.label }}</span>
                  </button>
                }
              </div>
            </div>

            @if (error()) {
              <div class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {{ error() }}
              </div>
            }

            <button type="submit" class="btn-primary w-full" [disabled]="loading() || form.invalid">
              @if (loading()) { <app-spinner size="sm" /> } @else { Crear cuenta }
            </button>
          </form>

          <p class="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?
            <a routerLink="/login" class="text-purple-600 font-medium hover:underline">Inicia sesión</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly roleOptions = [
    { value: 0, label: 'Lector', icon: '📖' },
    { value: 1, label: 'Escritor', icon: '✍️' },
  ];

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: [0],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const { email, username, password, role } = this.form.value;
    this.auth.register(email!, username!, password!, role!).subscribe({
      next: () => {
        this.auth.loadProfile().subscribe(() => this.router.navigate(['/onboarding']));
      },
      error: (err) => {
        this.error.set(err?.message || 'Error al crear la cuenta');
        this.loading.set(false);
      },
    });
  }
}

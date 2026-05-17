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
    <div class="min-h-screen flex">

      <!-- Panel izquierdo — editorial (solo desktop) -->
      <div class="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
           style="background-color: #1A1410;" aria-hidden="true">

        <!-- Radial gradient overlay -->
        <div class="absolute inset-0 pointer-events-none"
             style="background: radial-gradient(ellipse at 20% 50%, rgba(196,107,30,0.18) 0%, transparent 65%);"></div>

        <!-- Logo -->
        <div class="relative flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-md flex items-center justify-center" style="background-color: #C46B1E;">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span class="font-bold text-white text-lg tracking-tight"
                style="font-family: 'Playfair Display', Georgia, serif;">Inkly</span>
        </div>

        <!-- Cita literaria -->
        <div class="relative space-y-5">
          <div class="w-10 h-0.5" style="background-color: #C46B1E;"></div>
          <blockquote class="text-[26px] font-bold leading-snug tracking-tight"
                      style="color: #FAF6F0; font-family: 'Playfair Display', Georgia, serif;">
            "Un lector vive mil vidas antes de morir. El que nunca lee, solo vive una."
          </blockquote>
          <p class="text-sm font-medium" style="color: #8C7B70;">— George R.R. Martin</p>
        </div>

        <!-- Stats -->
        <div class="relative flex gap-8 pt-6" style="border-top: 1px solid rgba(255,255,255,0.08);">
          <div>
            <p class="text-2xl font-bold text-white">10K+</p>
            <p class="text-xs mt-0.5" style="color: #8C7B70;">Lectores activos</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-white">2K+</p>
            <p class="text-xs mt-0.5" style="color: #8C7B70;">Escritores</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-white">50K+</p>
            <p class="text-xs mt-0.5" style="color: #8C7B70;">Capítulos</p>
          </div>
        </div>
      </div>

      <!-- Panel derecho — formulario -->
      <div class="flex-1 flex items-center justify-center p-6 sm:p-10"
           style="background-color: #FAF6F0;">
        <div class="w-full max-w-sm animate-fade-in">

          <!-- Logo móvil -->
          <div class="lg:hidden flex items-center gap-2 mb-8">
            <div class="w-8 h-8 rounded-md flex items-center justify-center"
                 style="background-color: #1A1410;">
              <svg class="w-4 h-4" style="color: #C46B1E;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span class="font-bold text-base tracking-tight"
                  style="color: #1A1410; font-family: 'Playfair Display', Georgia, serif;">Inkly</span>
          </div>

          <div class="mb-8">
            <h1 class="text-3xl font-bold tracking-tight"
                style="color: #1A1410; font-family: 'Playfair Display', Georgia, serif;">
              Bienvenido de vuelta
            </h1>
            <p class="text-sm mt-1.5" style="color: #5C4E44;">Inicia sesión para continuar leyendo</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4" novalidate>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-semibold mb-2" style="color: #1A1410;">
                Correo electrónico
              </label>
              <input id="email" formControlName="email" type="email"
                placeholder="tu@email.com" autocomplete="email"
                [attr.aria-invalid]="form.get('email')?.invalid && form.get('email')?.touched"
                class="input-field w-full"
                [style.border-color]="(form.get('email')?.invalid && form.get('email')?.touched) ? '#A8432B' : '#DDD6D1'" />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="text-xs mt-1.5 flex items-center gap-1" style="color: #A8432B;" role="alert">
                  <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  Email válido requerido
                </p>
              }
            </div>

            <!-- Contraseña -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label for="password" class="block text-sm font-semibold" style="color: #1A1410;">
                  Contraseña
                </label>
                <a routerLink="/forgot-password"
                  class="text-xs font-medium hover:underline transition-colors"
                  style="color: #C46B1E;">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <input id="password" formControlName="password" type="password"
                placeholder="••••••••" autocomplete="current-password"
                [attr.aria-invalid]="form.get('password')?.invalid && form.get('password')?.touched"
                class="input-field w-full"
                [style.border-color]="(form.get('password')?.invalid && form.get('password')?.touched) ? '#A8432B' : '#DDD6D1'" />
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="text-xs mt-1.5 flex items-center gap-1" style="color: #A8432B;" role="alert">
                  <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  Mínimo 8 caracteres
                </p>
              }
            </div>

            <!-- Error global -->
            @if (error()) {
              <div class="flex items-start gap-2.5 text-sm px-4 py-3 rounded-md"
                   style="background-color: #F5E0DA; border: 1px solid #A8432B; color: #A8432B;"
                   role="alert">
                <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                {{ error() }}
              </div>
            }

            <button type="submit" class="btn-primary w-full mt-2 py-3" [disabled]="loading() || form.invalid">
              @if (loading()) { <app-spinner size="sm" /> } @else { Iniciar sesión }
            </button>
          </form>

          <p class="text-center text-sm mt-7" style="color: #5C4E44;">
            ¿No tienes cuenta?
            <a routerLink="/register" class="font-semibold hover:underline" style="color: #C46B1E;">
              Regístrate gratis
            </a>
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

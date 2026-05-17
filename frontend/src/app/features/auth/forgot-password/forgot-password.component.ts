import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-forgot-password',
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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900">Recuperar contraseña</h1>
          <p class="text-gray-500 mt-1">Te enviaremos un enlace de recuperación</p>
        </div>

        <div class="card p-5 sm:p-8">

          <!-- Estado: éxito -->
          @if (sent()) {
            <div class="text-center space-y-4">
              <div class="inline-flex w-14 h-14 rounded-full bg-green-100 items-center justify-center">
                <svg class="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p class="text-gray-700 font-medium">Revisa tu correo electrónico</p>
              <p class="text-gray-500 text-sm">
                Si el email está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>

              @if (devResetUrl()) {
                <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
                  <p class="text-xs font-semibold text-amber-700 mb-1">Modo desarrollo — enlace directo:</p>
                  <a [href]="devResetUrl()!" class="text-xs text-purple-600 hover:underline break-all">
                    {{ devResetUrl() }}
                  </a>
                </div>
              }

              <a routerLink="/login"
                class="inline-block mt-2 text-sm text-purple-600 font-medium hover:underline">
                Volver al inicio de sesión
              </a>
            </div>
          }

          <!-- Estado: formulario -->
          @if (!sent()) {
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input formControlName="email" type="email" class="input-field"
                  placeholder="tu@email.com" autocomplete="email" />
                @if (form.get('email')?.invalid && form.get('email')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Introduce un email válido</p>
                }
              </div>

              @if (error()) {
                <div class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {{ error() }}
                </div>
              }

              <button type="submit" class="btn-primary w-full" [disabled]="loading() || form.invalid">
                @if (loading()) { <app-spinner size="sm" /> } @else { Enviar enlace de recuperación }
              </button>

              <p class="text-center text-sm text-gray-500">
                <a routerLink="/login" class="text-purple-600 font-medium hover:underline">
                  Volver al inicio de sesión
                </a>
              </p>
            </form>
          }

        </div>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly sent = signal(false);
  readonly devResetUrl = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const { email } = this.form.value;
    this.auth.forgotPassword(email!).subscribe({
      next: (res) => {
        this.sent.set(true);
        if (res.reset_token) {
          this.devResetUrl.set(`${window.location.origin}/reset-password?token=${res.reset_token}`);
        }
      },
      error: () => {
        this.error.set('Error al procesar la solicitud. Inténtalo de nuevo.');
        this.loading.set(false);
      },
    });
  }
}

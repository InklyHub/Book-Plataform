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
    <div class="min-h-screen flex items-center justify-center p-6" style="background-color: #FAF6F0;">
      <div class="w-full max-w-sm animate-fade-in">

        <!-- Logo -->
        <div class="flex items-center gap-2.5 mb-10">
          <div class="w-8 h-8 rounded-md flex items-center justify-center" style="background-color: #1A1410;">
            <svg class="w-4 h-4" style="color: #C46B1E;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span class="font-bold text-lg tracking-tight"
                style="color: #1A1410; font-family: 'Playfair Display', Georgia, serif;">Inkly</span>
        </div>

        <div class="bg-white rounded-md p-8" style="border: 1px solid #DDD6D1;">

          @if (sent()) {
            <!-- Estado: enviado -->
            <div class="text-center space-y-5">
              <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                   style="background-color: rgba(196,107,30,0.12);">
                <svg class="w-6 h-6" style="color: #C46B1E;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 class="text-xl font-bold"
                    style="color: #1A1410; font-family: 'Playfair Display', Georgia, serif;">
                  Revisa tu correo
                </h1>
                <p class="text-sm mt-2 leading-relaxed" style="color: #5C4E44;">
                  Si el email está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                </p>
              </div>

              @if (devResetUrl()) {
                <div class="p-3 rounded-md text-left"
                     style="background-color: #FAE8D5; border: 1px solid #C46B1E;">
                  <p class="text-xs font-semibold mb-1" style="color: #C46B1E;">
                    Modo desarrollo — enlace directo:
                  </p>
                  <a [href]="devResetUrl()!" class="text-xs break-all hover:underline" style="color: #C46B1E;">
                    {{ devResetUrl() }}
                  </a>
                </div>
              }

              <a routerLink="/login" class="inline-block text-sm font-semibold hover:underline"
                 style="color: #C46B1E;">
                Volver al inicio de sesión
              </a>
            </div>
          } @else {
            <!-- Estado: formulario -->
            <div class="mb-7">
              <h1 class="text-2xl font-bold tracking-tight"
                  style="color: #1A1410; font-family: 'Playfair Display', Georgia, serif;">
                Recuperar contraseña
              </h1>
              <p class="text-sm mt-1.5 leading-relaxed" style="color: #5C4E44;">
                Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4" novalidate>
              <div>
                <label for="recovery-email" class="block text-sm font-semibold mb-2" style="color: #1A1410;">
                  Correo electrónico
                </label>
                <input id="recovery-email" formControlName="email" type="email"
                  placeholder="tu@email.com" autocomplete="email"
                  [attr.aria-invalid]="form.get('email')?.invalid && form.get('email')?.touched"
                  class="input-field w-full"
                  [style.border-color]="(form.get('email')?.invalid && form.get('email')?.touched) ? '#A8432B' : '#DDD6D1'" />
                @if (form.get('email')?.invalid && form.get('email')?.touched) {
                  <p class="text-xs mt-1.5 flex items-center gap-1" style="color: #A8432B;" role="alert">
                    <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    Introduce un email válido
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

              <button type="submit" class="btn-primary w-full py-3 mt-2" [disabled]="loading() || form.invalid">
                @if (loading()) { <app-spinner size="sm" /> } @else { Enviar enlace de recuperación }
              </button>
            </form>

            <p class="text-center text-sm mt-7">
              <a routerLink="/login" class="font-semibold hover:underline" style="color: #C46B1E;">
                Volver al inicio de sesión
              </a>
            </p>
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

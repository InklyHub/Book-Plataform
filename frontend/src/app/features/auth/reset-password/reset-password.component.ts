import { Component, inject, signal, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

const passwordsMatch = (group: AbstractControl): ValidationErrors | null => {
  const pw = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
};

@Component({
  selector: 'app-reset-password',
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

          @if (tokenMissing()) {
            <!-- Token inválido -->
            <div class="text-center space-y-5">
              <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                   style="background-color: #F5E0DA;">
                <svg class="w-6 h-6" style="color: #A8432B;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 class="text-xl font-bold"
                    style="color: #1A1410; font-family: 'Playfair Display', Georgia, serif;">
                  Enlace inválido
                </h1>
                <p class="text-sm mt-2 leading-relaxed" style="color: #5C4E44;">
                  Este enlace no es válido o ha expirado. Los enlaces de recuperación duran 15 minutos.
                </p>
              </div>
              <a routerLink="/forgot-password" class="btn-primary inline-flex">
                Solicitar nuevo enlace
              </a>
            </div>
          }

          @if (done()) {
            <!-- Éxito -->
            <div class="text-center space-y-5">
              <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                   style="background-color: rgba(196,107,30,0.12);">
                <svg class="w-6 h-6" style="color: #C46B1E;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h1 class="text-xl font-bold"
                    style="color: #1A1410; font-family: 'Playfair Display', Georgia, serif;">
                  Contraseña actualizada
                </h1>
                <p class="text-sm mt-2" style="color: #5C4E44;">
                  Ya puedes iniciar sesión con tu nueva contraseña.
                </p>
              </div>
              <a routerLink="/login" class="btn-primary inline-flex">
                Ir al inicio de sesión
              </a>
            </div>
          }

          @if (!tokenMissing() && !done()) {
            <!-- Formulario -->
            <div class="mb-7">
              <h1 class="text-2xl font-bold tracking-tight"
                  style="color: #1A1410; font-family: 'Playfair Display', Georgia, serif;">
                Nueva contraseña
              </h1>
              <p class="text-sm mt-1.5" style="color: #5C4E44;">
                Elige una contraseña segura para tu cuenta.
              </p>
            </div>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4" novalidate>
              <div>
                <label for="new-password" class="block text-sm font-semibold mb-2" style="color: #1A1410;">
                  Nueva contraseña
                </label>
                <input id="new-password" formControlName="newPassword" type="password"
                  placeholder="••••••••" autocomplete="new-password"
                  [attr.aria-invalid]="form.get('newPassword')?.invalid && form.get('newPassword')?.touched"
                  class="input-field w-full"
                  [style.border-color]="(form.get('newPassword')?.invalid && form.get('newPassword')?.touched) ? '#A8432B' : '#DDD6D1'" />
                @if (form.get('newPassword')?.invalid && form.get('newPassword')?.touched) {
                  <p class="text-xs mt-1.5 flex items-center gap-1" style="color: #A8432B;" role="alert">
                    <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    Mínimo 8 caracteres
                  </p>
                }
              </div>

              <div>
                <label for="confirm-password" class="block text-sm font-semibold mb-2" style="color: #1A1410;">
                  Confirmar contraseña
                </label>
                <input id="confirm-password" formControlName="confirmPassword" type="password"
                  placeholder="••••••••" autocomplete="new-password"
                  [attr.aria-invalid]="form.hasError('mismatch') && form.get('confirmPassword')?.touched"
                  class="input-field w-full"
                  [style.border-color]="(form.hasError('mismatch') && form.get('confirmPassword')?.touched) ? '#A8432B' : '#DDD6D1'" />
                @if (form.hasError('mismatch') && form.get('confirmPassword')?.touched) {
                  <p class="text-xs mt-1.5 flex items-center gap-1" style="color: #A8432B;" role="alert">
                    <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    Las contraseñas no coinciden
                  </p>
                }
              </div>

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
                @if (loading()) { <app-spinner size="sm" /> } @else { Establecer nueva contraseña }
              </button>
            </form>
          }
        </div>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  private token = '';

  readonly loading = signal(false);
  readonly error = signal('');
  readonly done = signal(false);
  readonly tokenMissing = signal(false);

  readonly form = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch }
  );

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) this.tokenMissing.set(true);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const { newPassword } = this.form.value;
    this.auth.resetPassword(this.token, newPassword!).subscribe({
      next: () => this.done.set(true),
      error: (err) => {
        this.error.set(err.error?.detail || 'El enlace ha expirado. Solicita uno nuevo.');
        this.loading.set(false);
      },
    });
  }
}

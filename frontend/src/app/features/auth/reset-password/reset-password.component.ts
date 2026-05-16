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
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div class="w-full max-w-md animate-fade-in">

        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 items-center justify-center mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900">Nueva contraseña</h1>
          <p class="text-gray-500 mt-1">Elige una contraseña segura</p>
        </div>

        <div class="card p-5 sm:p-8">

          <!-- Token inválido -->
          @if (tokenMissing()) {
            <div class="text-center space-y-4">
              <div class="inline-flex w-14 h-14 rounded-full bg-red-100 items-center justify-center">
                <svg class="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p class="text-gray-700 font-medium">Enlace inválido o expirado</p>
              <p class="text-gray-500 text-sm">Este enlace no es válido o ha expirado (duran 15 minutos).</p>
              <a routerLink="/forgot-password" class="inline-block btn-primary text-sm px-6 py-2 mt-2">
                Solicitar nuevo enlace
              </a>
            </div>
          }

          <!-- Éxito -->
          @if (done()) {
            <div class="text-center space-y-4">
              <div class="inline-flex w-14 h-14 rounded-full bg-green-100 items-center justify-center">
                <svg class="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p class="text-gray-700 font-medium">¡Contraseña actualizada!</p>
              <p class="text-gray-500 text-sm">Ya puedes iniciar sesión con tu nueva contraseña.</p>
              <a routerLink="/login" class="inline-block btn-primary text-sm px-6 py-2 mt-2">
                Ir al inicio de sesión
              </a>
            </div>
          }

          <!-- Formulario -->
          @if (!tokenMissing() && !done()) {
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Nueva contraseña</label>
                <input formControlName="newPassword" type="password" class="input-field"
                  placeholder="••••••••" autocomplete="new-password" />
                @if (form.get('newPassword')?.invalid && form.get('newPassword')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Mínimo 8 caracteres</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
                <input formControlName="confirmPassword" type="password" class="input-field"
                  placeholder="••••••••" autocomplete="new-password" />
                @if (form.hasError('mismatch') && form.get('confirmPassword')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Las contraseñas no coinciden</p>
                }
              </div>

              @if (error()) {
                <div class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {{ error() }}
                </div>
              }

              <button type="submit" class="btn-primary w-full" [disabled]="loading() || form.invalid">
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

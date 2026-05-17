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

        <!-- Propuesta de valor -->
        <div class="relative space-y-8">
          <div>
            <div class="w-10 h-0.5 mb-5" style="background-color: #C46B1E;"></div>
            <h2 class="text-[28px] font-bold leading-snug tracking-tight mb-3"
                style="color: #FAF6F0; font-family: 'Playfair Display', Georgia, serif;">
              Tu próxima historia favorita te está esperando
            </h2>
            <p class="text-sm leading-relaxed" style="color: #8C7B70;">
              Miles de obras, géneros para todos los gustos, y una comunidad de escritores apasionados.
            </p>
          </div>

          <div class="space-y-4">
            @for (feature of features; track feature.title) {
              <div class="flex items-start gap-3.5">
                <div class="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                     style="background-color: rgba(196,107,30,0.15);">
                  <svg class="w-3.5 h-3.5" style="color: #C46B1E;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" [attr.d]="feature.iconPath" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-semibold text-white">{{ feature.title }}</p>
                  <p class="text-xs mt-0.5" style="color: #8C7B70;">{{ feature.desc }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <p class="relative text-xs" style="color: #5C4E44;">
          Al registrarte aceptas nuestros Términos de servicio y Política de privacidad.
        </p>
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
              Crear cuenta
            </h1>
            <p class="text-sm mt-1.5" style="color: #5C4E44;">Empieza tu aventura lectora hoy</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4" novalidate>

            <!-- Nombre de usuario -->
            <div>
              <label for="username" class="block text-sm font-semibold mb-2" style="color: #1A1410;">
                Nombre de usuario
              </label>
              <input id="username" formControlName="username" type="text"
                placeholder="tu_nombre" autocomplete="username"
                [attr.aria-invalid]="form.get('username')?.invalid && form.get('username')?.touched"
                class="input-field w-full"
                [style.border-color]="(form.get('username')?.invalid && form.get('username')?.touched) ? '#A8432B' : '#DDD6D1'" />
              @if (form.get('username')?.invalid && form.get('username')?.touched) {
                <p class="text-xs mt-1.5 flex items-center gap-1" style="color: #A8432B;" role="alert">
                  <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  Mínimo 3 caracteres
                </p>
              }
            </div>

            <!-- Email -->
            <div>
              <label for="reg-email" class="block text-sm font-semibold mb-2" style="color: #1A1410;">
                Correo electrónico
              </label>
              <input id="reg-email" formControlName="email" type="email"
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
              <label for="reg-password" class="block text-sm font-semibold mb-2" style="color: #1A1410;">
                Contraseña
              </label>
              <input id="reg-password" formControlName="password" type="password"
                placeholder="Mínimo 8 caracteres" autocomplete="new-password"
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

            <!-- Tipo de cuenta -->
            <fieldset>
              <legend class="block text-sm font-semibold mb-2" style="color: #1A1410;">Quiero...</legend>
              <div class="grid grid-cols-2 gap-3">
                @for (opt of roleOptions; track opt.value) {
                  <button type="button"
                    (click)="form.get('role')?.setValue(opt.value)"
                    [attr.aria-pressed]="form.get('role')?.value === opt.value"
                    class="flex items-center gap-3 p-3.5 rounded-md border-2 transition-all text-left"
                    [style.border-color]="form.get('role')?.value === opt.value ? '#C46B1E' : '#DDD6D1'"
                    [style.background-color]="form.get('role')?.value === opt.value ? '#FAE8D5' : '#FFFFFF'">
                    <div class="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                         [style.background-color]="form.get('role')?.value === opt.value ? '#C46B1E' : '#F0EBE6'">
                      <svg class="w-4 h-4"
                           [style.color]="form.get('role')?.value === opt.value ? '#FFFFFF' : '#8C7B70'"
                           fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="opt.iconPath" />
                      </svg>
                    </div>
                    <span class="text-sm font-semibold"
                          [style.color]="form.get('role')?.value === opt.value ? '#C46B1E' : '#5C4E44'">
                      {{ opt.label }}
                    </span>
                  </button>
                }
              </div>
            </fieldset>

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
              @if (loading()) { <app-spinner size="sm" /> } @else { Crear cuenta }
            </button>
          </form>

          <p class="text-center text-sm mt-7" style="color: #5C4E44;">
            ¿Ya tienes cuenta?
            <a routerLink="/login" class="font-semibold hover:underline" style="color: #C46B1E;">
              Inicia sesión
            </a>
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

  readonly features = [
    {
      title: 'Miles de obras',
      desc: 'Novelas, manga, técnicos y más géneros',
      iconPath: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    },
    {
      title: 'Publica tus historias',
      desc: 'Comparte tu creatividad con el mundo',
      iconPath: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
    },
    {
      title: 'Sistema de monedas',
      desc: 'Desbloquea contenido exclusivo',
      iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  readonly roleOptions = [
    {
      value: 0,
      label: 'Leer',
      iconPath: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    },
    {
      value: 1,
      label: 'Escribir',
      iconPath: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
    },
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

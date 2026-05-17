import { Component, inject, signal, OnInit, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MonetizationService } from '../../../core/services/monetization.service';
import { BookService } from '../../../core/services/book.service';
import { CoinPackage, Subscription } from '../../../core/models';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

type MonetizationModel = 'pay-per-chapter' | 'coins' | 'subscription';

@Component({
  selector: 'app-monetization',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, SpinnerComponent],
  template: `
    <div class="p-4 sm:p-6 max-w-3xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/writer"
           class="inline-flex items-center gap-1.5 text-sm text-ink-40 hover:text-ink transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </a>
        <h1>Monetización</h1>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20" aria-live="polite"><app-spinner size="lg" /></div>
      } @else {

        <!-- Modelo de monetización -->
        <div class="bg-white rounded-xl border border-ink-10 p-6 mb-5">
          <h2 class="mb-5">Modelo de ingresos</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            @for (m of models; track m.value) {
              <button type="button"
                (click)="selectedModel.set(m.value)"
                [attr.aria-pressed]="selectedModel() === m.value"
                class="flex flex-col gap-2.5 p-4 rounded-xl border-2 text-left transition-all"
                [class.border-ink]="selectedModel() === m.value"
                [class.bg-ink-5]="selectedModel() === m.value"
                [class.border-ink-10]="selectedModel() !== m.value"
                [class.hover:border-ink-20]="selectedModel() !== m.value">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                     [style.background-color]="selectedModel() === m.value ? 'rgba(196,107,30,0.12)' : '#F0EBE6'">
                  <svg class="w-4 h-4" [style.color]="selectedModel() === m.value ? '#C46B1E' : '#b8a99a'"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="m.iconPath" />
                  </svg>
                </div>
                <span class="font-semibold text-sm text-ink">{{ m.label }}</span>
                <span class="text-xs text-ink-40 leading-relaxed">{{ m.description }}</span>
              </button>
            }
          </div>

          <!-- Configuración según modelo -->
          @if (selectedModel() === 'pay-per-chapter') {
            <form [formGroup]="settingsForm" class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-ink-60 mb-2">Precio por capítulo (€)</label>
                <input formControlName="price_per_chapter" type="number" step="0.01" min="0.01"
                  class="input-field w-48" placeholder="0.99" />
              </div>
            </form>
          }

          @if (selectedModel() === 'coins') {
            <form [formGroup]="settingsForm" class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-ink-60 mb-2">Coins por capítulo</label>
                <input formControlName="coins_per_chapter" type="number" min="1"
                  class="input-field w-48" placeholder="50" />
              </div>
              <p class="text-xs text-ink-40">
                La plataforma retiene el {{ platformCut }}% de los coins recaudados.
              </p>
            </form>
          }

          @if (selectedModel() === 'subscription') {
            <p class="text-sm text-ink-40 bg-ink-5 rounded-xl p-4 border border-ink-10 leading-relaxed">
              Con el modelo de suscripción, los usuarios con plan activo pueden acceder a todos tus capítulos
              bloqueados sin coste adicional. La plataforma distribuye los ingresos proporcionalmente según el
              tiempo de lectura.
            </p>
          }

          @if (saveMsg()) {
            <div class="flex items-center gap-2 text-sm px-4 py-3 rounded-xl mt-4 border"
                 style="background-color: rgba(196,107,30,0.06); border-color: rgba(196,107,30,0.2); color: #C46B1E;"
                 role="status">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ saveMsg() }}
            </div>
          }
          @if (saveError()) {
            <div class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mt-4" role="alert">
              {{ saveError() }}
            </div>
          }

          <div class="flex justify-end mt-5">
            <button class="btn-primary" (click)="saveSettings()" [disabled]="saving()">
              @if (saving()) { <app-spinner size="sm" /> } @else { Guardar configuración }
            </button>
          </div>
        </div>

        <!-- Paquetes de coins -->
        <div class="bg-white rounded-xl border border-ink-10 p-6 mb-5">
          <h2 class="mb-1">Paquetes de coins disponibles</h2>
          <p class="text-sm text-ink-40 mb-5">Estos son los paquetes que los lectores pueden comprar:</p>
          @if (loadingPackages()) {
            <app-spinner />
          } @else {
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              @for (pkg of packages(); track pkg.id) {
                <div class="border border-ink-10 rounded-xl p-3 text-center bg-ink-5">
                  <p class="text-xl font-bold text-ink tabular-nums">{{ pkg.coins }}</p>
                  @if (pkg.bonus > 0) {
                    <p class="text-xs font-medium mt-0.5" style="color: #C46B1E;">+{{ pkg.bonus }} bonus</p>
                  }
                  <p class="text-xs text-ink-40 mt-1">coins</p>
                  <p class="text-sm font-bold text-ink mt-1">{{ pkg.price | number:'1.2-2' }} €</p>
                </div>
              }
            </div>
          }
        </div>

        <!-- Planes de suscripción -->
        <div class="bg-white rounded-xl border border-ink-10 p-6">
          <h2 class="mb-1">Planes de suscripción</h2>
          <p class="text-sm text-ink-40 mb-5">Los lectores con estos planes acceden a tu contenido:</p>
          @if (loadingSubscriptions()) {
            <app-spinner />
          } @else {
            <div class="grid sm:grid-cols-3 gap-3">
              @for (sub of subscriptions(); track sub.id) {
                <div class="bg-white rounded-xl border border-ink-10 p-4">
                  <p class="font-bold text-ink">{{ sub.name }}</p>
                  <p class="text-2xl font-bold text-ink mt-1">
                    {{ sub.price_monthly | number:'1.2-2' }}
                    <span class="text-sm font-normal text-ink-40">€/mes</span>
                  </p>
                  <p class="text-xs text-ink-40 mt-2">{{ sub.coins_per_month }} coins/mes</p>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MonetizationComponent implements OnInit {
  readonly bookId = input.required<string>();

  private readonly monetizationService = inject(MonetizationService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly loadingPackages = signal(true);
  readonly loadingSubscriptions = signal(true);
  readonly saving = signal(false);
  readonly saveMsg = signal('');
  readonly saveError = signal('');
  readonly selectedModel = signal<MonetizationModel>('coins');
  readonly packages = signal<CoinPackage[]>([]);
  readonly subscriptions = signal<Subscription[]>([]);
  readonly platformCut = 30;

  readonly models = [
    {
      value: 'coins' as MonetizationModel,
      label: 'Coins',
      description: 'Los lectores gastan coins para desbloquear capítulos.',
      iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      value: 'pay-per-chapter' as MonetizationModel,
      label: 'Pago directo',
      description: 'Precio fijo en euros por cada capítulo bloqueado.',
      iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    },
    {
      value: 'subscription' as MonetizationModel,
      label: 'Suscripción',
      description: 'Acceso incluido para suscriptores de la plataforma.',
      iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
  ];

  readonly settingsForm = this.fb.group({
    price_per_chapter: [null as number | null],
    coins_per_chapter: [50],
  });

  ngOnInit(): void {
    this.monetizationService.getMonetizationSettings(this.bookId()).subscribe({
      next: ms => {
        this.selectedModel.set(ms.model);
        this.settingsForm.patchValue({
          price_per_chapter: ms.price_per_chapter,
          coins_per_chapter: ms.coins_per_chapter,
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.monetizationService.getCoinPackages().subscribe({
      next: pkgs => { this.packages.set(pkgs); this.loadingPackages.set(false); },
      error: () => this.loadingPackages.set(false),
    });

    this.monetizationService.getSubscriptions().subscribe({
      next: subs => { this.subscriptions.set(subs); this.loadingSubscriptions.set(false); },
      error: () => this.loadingSubscriptions.set(false),
    });
  }

  saveSettings(): void {
    this.saving.set(true);
    this.saveMsg.set('');
    this.saveError.set('');

    const v = this.settingsForm.value;
    const payload = {
      model: this.selectedModel(),
      price_per_chapter: this.selectedModel() === 'pay-per-chapter' ? v.price_per_chapter : null,
      coins_per_chapter: this.selectedModel() === 'coins' ? v.coins_per_chapter : null,
    };

    this.monetizationService.setMonetizationSettings(this.bookId(), payload).subscribe({
      next: () => {
        this.saveMsg.set('¡Configuración guardada correctamente!');
        this.saving.set(false);
        setTimeout(() => this.saveMsg.set(''), 4000);
      },
      error: err => {
        this.saveError.set(err.message || 'Error al guardar');
        this.saving.set(false);
      },
    });
  }
}

import { Component, inject, signal, OnInit, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MonetizationService } from '../../../core/services/monetization.service';
import { BookService } from '../../../core/services/book.service';
import { CoinPackage, Subscription } from '../../../core/models';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { CoinBadgeComponent } from '../../../shared/components/coin-badge/coin-badge.component';

type MonetizationModel = 'pay-per-chapter' | 'coins' | 'subscription';

@Component({
  selector: 'app-monetization',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, SpinnerComponent, CoinBadgeComponent],
  template: `
    <div class="p-3 sm:p-6 max-w-3xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/writer" class="btn-ghost">← Volver</a>
        <h1 class="text-2xl font-bold text-gray-900">Monetización</h1>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20"><app-spinner size="lg" /></div>
      } @else {
        <!-- Modelo de monetización -->
        <div class="card p-6 mb-5">
          <h2 class="font-bold text-lg text-gray-900 mb-4">Modelo de ingresos</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            @for (m of models; track m.value) {
              <button type="button"
                (click)="selectedModel.set(m.value)"
                [class]="'flex flex-col gap-2 p-4 rounded-xl border-2 text-left transition-all ' +
                         (selectedModel() === m.value
                           ? 'border-purple-500 bg-purple-50'
                           : 'border-gray-200 hover:border-purple-200')">
                <span class="text-2xl">{{ m.icon }}</span>
                <span class="font-semibold text-sm text-gray-900">{{ m.label }}</span>
                <span class="text-xs text-gray-500 leading-relaxed">{{ m.description }}</span>
              </button>
            }
          </div>

          <!-- Configuración según modelo -->
          @if (selectedModel() === 'pay-per-chapter') {
            <form [formGroup]="settingsForm" class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Precio por capítulo (€)</label>
                <input formControlName="price_per_chapter" type="number" step="0.01" min="0.01"
                  class="input-field w-48" placeholder="0.99" />
              </div>
            </form>
          }

          @if (selectedModel() === 'coins') {
            <form [formGroup]="settingsForm" class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Coins por capítulo</label>
                <input formControlName="coins_per_chapter" type="number" min="1"
                  class="input-field w-48" placeholder="50" />
              </div>
              <p class="text-xs text-gray-400">
                La plataforma retiene el {{ platformCut }}% de los coins recaudados.
              </p>
            </form>
          }

          @if (selectedModel() === 'subscription') {
            <p class="text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
              📋 Con el modelo de suscripción, los usuarios con plan activo pueden acceder a todos tus capítulos bloqueados sin coste adicional.
              La plataforma distribuye los ingresos proporcionalmente según el tiempo de lectura.
            </p>
          }

          @if (saveMsg()) {
            <div class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mt-4">
              {{ saveMsg() }}
            </div>
          }
          @if (saveError()) {
            <div class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mt-4">
              {{ saveError() }}
            </div>
          }

          <div class="flex justify-end mt-5">
            <button class="btn-primary" (click)="saveSettings()" [disabled]="saving()">
              @if (saving()) { <app-spinner size="sm" /> } @else { Guardar configuración }
            </button>
          </div>
        </div>

        <!-- Paquetes de coins (info para el escritor) -->
        <div class="card p-6 mb-5">
          <h2 class="font-bold text-lg text-gray-900 mb-1">Paquetes de coins disponibles</h2>
          <p class="text-sm text-gray-500 mb-4">Estos son los paquetes que los lectores pueden comprar:</p>
          @if (loadingPackages()) {
            <app-spinner />
          } @else {
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              @for (pkg of packages(); track pkg.id) {
                <div class="border border-gray-100 rounded-xl p-3 text-center bg-gray-50">
                  <p class="text-xl font-bold text-purple-700">{{ pkg.coins }}</p>
                  @if (pkg.bonus > 0) {
                    <p class="text-xs text-green-600 font-medium">+{{ pkg.bonus }} bonus</p>
                  }
                  <p class="text-xs text-gray-500 mt-1">🪙 coins</p>
                  <p class="text-sm font-bold text-gray-900 mt-1">{{ pkg.price | number:'1.2-2' }} €</p>
                </div>
              }
            </div>
          }
        </div>

        <!-- Planes de suscripción (info) -->
        <div class="card p-6">
          <h2 class="font-bold text-lg text-gray-900 mb-1">Planes de suscripción</h2>
          <p class="text-sm text-gray-500 mb-4">Los lectores con estos planes acceden a tu contenido:</p>
          @if (loadingSubscriptions()) {
            <app-spinner />
          } @else {
            <div class="grid sm:grid-cols-3 gap-3">
              @for (sub of subscriptions(); track sub.id) {
                <div class="border border-purple-100 rounded-xl p-4 bg-purple-50/30">
                  <p class="font-bold text-purple-800">{{ sub.name }}</p>
                  <p class="text-2xl font-bold text-gray-900 mt-1">{{ sub.price_monthly | number:'1.2-2' }} <span class="text-sm font-normal text-gray-500">€/mes</span></p>
                  <p class="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    🪙 {{ sub.coins_per_month }} coins/mes
                  </p>
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
    { value: 'coins' as MonetizationModel,           icon: '🪙', label: 'Coins',          description: 'Los lectores gastan coins para desbloquear capítulos.' },
    { value: 'pay-per-chapter' as MonetizationModel, icon: '💳', label: 'Pago directo',    description: 'Precio fijo en euros por cada capítulo bloqueado.' },
    { value: 'subscription' as MonetizationModel,    icon: '📋', label: 'Suscripción',     description: 'Acceso incluido para suscriptores de la plataforma.' },
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

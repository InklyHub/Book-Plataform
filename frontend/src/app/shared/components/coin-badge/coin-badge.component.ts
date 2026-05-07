import { Component, input } from '@angular/core';

@Component({
  selector: 'app-coin-badge',
  standalone: true,
  template: `
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium"
      [class]="size() === 'sm' ? 'text-xs' : 'text-sm'">
      <span>🪙</span>
      <span>{{ amount() }}</span>
    </span>
  `,
})
export class CoinBadgeComponent {
  readonly amount = input<number>(0);
  readonly size = input<'sm' | 'md'>('sm');
}

import { Component, input } from '@angular/core';

@Component({
  selector: 'app-coin-badge',
  standalone: true,
  template: `
    <span
      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border"
      [class]="size() === 'sm' ? 'text-xs' : 'text-sm'"
      style="background-color: #FAE8D5; border-color: rgba(196,107,30,.3); color: #C46B1E;">
      <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.93V18h-2v-1.07C9.4 16.73 8 15.5 8 14h2c0 .83.9 1.5 2 1.5s2-.67 2-1.5c0-.83-1-1.5-2-1.5-2.21 0-4-1.12-4-2.5 0-1.23 1.4-2.47 3-2.93V6h2v1.07c1.6.46 3 1.7 3 3.43h-2c0-.83-.9-1.5-2-1.5s-2 .67-2 1.5c0 .83 1 1.5 2 1.5 2.21 0 4 1.12 4 2.5 0 1.23-1.4 2.47-3 2.93z"/>
      </svg>
      <span>{{ amount() }}</span>
      <span class="sr-only">coins</span>
    </span>
  `,
})
export class CoinBadgeComponent {
  readonly amount = input<number>(0);
  readonly size = input<'sm' | 'md'>('sm');
}

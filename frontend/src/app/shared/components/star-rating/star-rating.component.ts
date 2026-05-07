import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  template: `
    <div class="flex items-center gap-0.5">
      @for (star of stars; track star) {
        <button
          type="button"
          (click)="interactive() && rate.emit(star)"
          [class]="'transition-colors ' + (interactive() ? 'cursor-pointer hover:scale-110' : 'cursor-default')"
          [disabled]="!interactive()">
          <svg
            [class]="'w-' + iconSize() + ' h-' + iconSize() + ' ' +
                     (star <= Math.round(value()) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300')"
            viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      }
      @if (showCount() && count() > 0) {
        <span class="text-xs text-gray-500 ml-1">({{ count() }})</span>
      }
    </div>
  `,
})
export class StarRatingComponent {
  readonly value = input<number>(0);
  readonly count = input<number>(0);
  readonly interactive = input<boolean>(false);
  readonly showCount = input<boolean>(true);
  readonly size = input<'sm' | 'md'>('sm');
  readonly rate = output<number>();

  readonly Math = Math;
  readonly stars = [1, 2, 3, 4, 5];

  get iconSize(): () => string {
    return () => this.size() === 'sm' ? '4' : '5';
  }
}

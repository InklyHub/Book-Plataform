import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Book } from '../../../core/models';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [RouterLink, DecimalPipe, StarRatingComponent],
  template: `
    <div class="card overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
      [routerLink]="['/book', book().id]">
      <!-- Portada -->
      <div class="relative aspect-[2/3] bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
        @if (book().cover_url) {
          <img [src]="book().cover_url" [alt]="book().title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        } @else {
          <div class="w-full h-full flex items-center justify-center">
            <svg class="w-12 h-12 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        }
        <!-- Badges -->
        <div class="absolute top-2 left-2 flex flex-col gap-1">
          @if (book().age_restriction) {
            <span class="badge bg-red-500 text-white text-xs">18+</span>
          }
          @if (book().is_monetized) {
            <span class="badge bg-yellow-400 text-yellow-900 text-xs">💰</span>
          }
        </div>
      </div>

      <!-- Info -->
      <div class="p-3">
        <h3 class="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight mb-1">{{ book().title }}</h3>
        <p class="text-xs text-gray-500 mb-2">{{ book().author.username }}</p>

        <div class="flex items-center justify-between">
          <app-star-rating [value]="book().rating_avg" [count]="book().rating_count" />
          <span class="text-xs text-gray-400 flex items-center gap-0.5">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
            {{ book().views_count | number }}
          </span>
        </div>

        <div class="flex flex-wrap gap-1 mt-2">
          <span class="badge-purple">{{ book().genre }}</span>
        </div>
      </div>
    </div>
  `,
})
export class BookCardComponent {
  readonly book = input.required<Book>();
}

import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Book } from '../../../core/models';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [RouterLink, DecimalPipe, StarRatingComponent],
  template: `
    <article
      class="group cursor-pointer"
      [routerLink]="['/book', book().id]">

      <!-- Portada — con clase book-card-cover que gestiona el efecto hover en styles.css -->
      <div class="book-card-cover aspect-[2/3] rounded-lg overflow-hidden bg-ink-5 mb-3 relative">

        @if (book().cover_url) {
          <img
            [src]="book().cover_url"
            [alt]="book().title"
            class="w-full h-full object-cover"
            loading="lazy" />
        } @else {
          <!-- Placeholder estilo lomo de libro -->
          <div class="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-ink-10 to-ink-5">
            <svg class="w-8 h-8 text-ink-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p class="text-ink-40 text-[11px] font-medium text-center px-3 line-clamp-3 leading-snug">
              {{ book().title }}
            </p>
          </div>
        }

        <!-- Overlay en hover: info adicional -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div class="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
            <span class="text-white/90 text-[11px] font-medium tracking-wide uppercase">
              {{ book().genre }}
            </span>
            <span class="text-white/70 text-[10px] flex items-center gap-1">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              {{ book().views_count | number }}
            </span>
          </div>
        </div>

        <!-- Badges siempre visibles -->
        <div class="absolute top-2 right-2 flex flex-col gap-1 items-end">
          @if (book().age_restriction) {
            <span class="px-1.5 py-0.5 rounded-full bg-[rgba(26,20,16,.75)] text-parchment backdrop-blur-sm text-[10px] font-bold leading-none">18+</span>
          }
          @if (book().is_monetized) {
            <span class="px-1.5 py-0.5 rounded-full bg-amber text-white text-[10px] font-bold leading-none">PRO</span>
          }
        </div>
      </div>

      <!-- Info — debajo de la portada, sin card -->
      <h3 class="font-display font-semibold text-[13px] text-ink line-clamp-2 leading-snug group-hover:text-amber transition-colors duration-200">
        {{ book().title }}
      </h3>
      <p class="text-[11px] text-ink-60 mt-0.5 truncate">{{ book().author.username }}</p>
      <div class="mt-1">
        <app-star-rating [value]="book().rating_avg" [count]="book().rating_count" />
      </div>
    </article>
  `,
})
export class BookCardComponent {
  readonly book = input.required<Book>();
}

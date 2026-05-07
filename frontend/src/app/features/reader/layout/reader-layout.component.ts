import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-reader-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="flex min-h-screen bg-gray-50">
      <app-sidebar mode="reader" />
      <main class="flex-1 ml-64 min-h-screen">
        <router-outlet />
      </main>
    </div>
  `,
})
export class ReaderLayoutComponent {}

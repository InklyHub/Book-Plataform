import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-writer-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="flex min-h-screen bg-gray-50">
      <app-sidebar />
      <main class="flex-1 ml-64 min-h-screen">
        <router-outlet />
      </main>
    </div>
  `,
})
export class WriterLayoutComponent {
  readonly auth = inject(AuthService);
}

import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterOutlet, Router, NavigationEnd} from '@angular/router';
import { NavbarComponent } from './components/navbar';
import { FooterComponent } from './components/footer';
import { filter } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  router = inject(Router);
  currentUrl = '';

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.urlAfterRedirects;
    });
  }

  hasNavigation(): boolean {
    const isSplash = this.currentUrl.startsWith('/splash');
    const isOnboarding = this.currentUrl.startsWith('/onboarding');
    const isAdminArea = this.currentUrl.startsWith('/admin') && this.currentUrl !== '/admin/login';
    
    return !isSplash && !isOnboarding && !isAdminArea;
  }
}

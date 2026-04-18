import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, CommonModule],
  template: `
    <div class="fixed inset-0 flex flex-col bg-slate-50 font-sans overflow-hidden">
      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto pb-[90px] bg-slate-50 relative custom-scrollbar">
        <!-- Header (Mobile Focus) -->
        <header class="bg-blue-600 shadow-sm px-5 py-4 pb-14 rounded-b-3xl">
          <div class="flex justify-between items-center text-white">
            <div>
              <div class="text-xs text-blue-200 uppercase tracking-widest font-semibold flex items-center gap-1">
                 <mat-icon class="text-[14px] w-[14px] h-[14px]">admin_panel_settings</mat-icon> Admin Center
              </div>
              <h1 class="text-xl font-bold mt-1">จัดการระบบ</h1>
            </div>
            <div class="flex items-center gap-2">
              <a routerLink="/" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white backdrop-blur-sm" title="กลับไปมุมมองผู้ใช้">
                <mat-icon>public</mat-icon>
              </a>
              <button (click)="logout()" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-rose-500/80 active:scale-95 transition-all text-white backdrop-blur-sm" title="ออกจากระบบ">
                <mat-icon>power_settings_new</mat-icon>
              </button>
            </div>
          </div>
        </header>

        <!-- Content Outlet inside a negative margin container -->
        <div class="px-4 -mt-8 relative z-10">
           <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Bottom Navigation Bar for Mobile -->
      <nav class="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/50 h-[70px] flex justify-around items-center px-1 z-[999] shadow-[0_-4px_24px_rgba(0,0,0,0.05)] pb-safe">
        <a routerLink="/admin/dashboard" routerLinkActive="text-blue-600 font-bold" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center justify-center w-16 text-slate-400 hover:text-blue-500 transition-colors">
          <mat-icon class="mb-1" [class.text-blue-600]="router.url === '/admin/dashboard'">dashboard</mat-icon>
          <span class="text-[10px]">ภาพรวม</span>
        </a>
        <a routerLink="/admin/routes" routerLinkActive="text-blue-600 font-bold" [routerLinkActiveOptions]="{exact: false}" class="flex flex-col items-center justify-center w-16 text-slate-400 hover:text-blue-500 transition-colors">
          <mat-icon class="mb-1" [class.text-blue-600]="router.url.includes('/admin/routes')">directions_bus</mat-icon>
          <span class="text-[10px]">เส้นทาง</span>
        </a>
        <a routerLink="/admin/places" routerLinkActive="text-blue-600 font-bold" [routerLinkActiveOptions]="{exact: false}" class="flex flex-col items-center justify-center w-16 text-slate-400 hover:text-blue-500 transition-colors">
          <mat-icon class="mb-1" [class.text-blue-600]="router.url.includes('/admin/places')">place</mat-icon>
          <span class="text-[10px]">จุดสำคัญ</span>
        </a>
        <a routerLink="/admin/reports" routerLinkActive="text-blue-600 font-bold" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center justify-center w-16 text-slate-400 hover:text-blue-500 transition-colors">
          <mat-icon class="mb-1" [class.text-blue-600]="router.url === '/admin/reports'">report_problem</mat-icon>
          <span class="text-[10px]">รายงาน</span>
        </a>
      </nav>
    </div>
  `
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  router = inject(Router);

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <!-- Top Nav Icon from Mockup -->
    <div class="fixed top-6 left-6 z-50 flex items-center gap-3 text-slate-400 opacity-80">
      <mat-icon class="text-[32px] w-[32px] h-[32px]">menu</mat-icon>
    </div>

    <!-- Main Container -->
    <div class="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden w-full">
      
      <!-- Top Graphic -->
      <div class="absolute top-0 left-0 w-full h-[55%] bg-blue-600 z-0 shadow-lg" style="clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);">
        <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: radial-gradient(circle at top left, rgba(255,255,255,0.4) 0%, transparent 60%), radial-gradient(circle at bottom right, rgba(0,0,0,0.2) 0%, transparent 50%); mix-blend-mode: overlay;"></div>
      </div>

      <div class="relative z-10 w-full max-w-sm px-6 flex flex-col items-center pt-8">
        <!-- Logo Match -->
        <div class="flex flex-col items-center mb-16 relative w-40 h-40 bg-white rounded-[2.5rem] shadow-[0_20px_40px_rgba(37,99,235,0.25)] justify-center border border-slate-100 overflow-hidden">
          <div class="absolute inset-0 bg-blue-50"></div>
          <!-- The Van Icon hovering over text -->
          <div class="relative z-10 text-blue-600 drop-shadow-sm mb-[-5px]">
             <mat-icon style="font-size: 64px; width: 64px; height: 64px;">airport_shuttle</mat-icon>
          </div>
          <!-- Huge KORAT Text -->
          <h1 class="text-4xl font-black text-blue-900 tracking-tight mt-1 relative z-10">KORAT</h1>
        </div>

        <form class="w-full space-y-4" (ngSubmit)="login()">
          <div>
            <label class="sr-only">Username</label>
            <input name="email" type="email" required [(ngModel)]="email" 
              class="w-full bg-white border border-slate-200 rounded-[2rem] px-6 py-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold shadow-sm" 
              placeholder="Username">
          </div>
          <div>
            <label class="sr-only">Password</label>
            <input name="password" type="password" required [(ngModel)]="password" 
              class="w-full bg-white border border-slate-200 rounded-[2rem] px-6 py-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold shadow-sm" 
              placeholder="Password">
          </div>

          <div class="text-center pt-2 pb-6">
            <a href="javascript:void(0)" class="text-blue-600 text-xs hover:text-blue-800 transition-colors font-bold">Forgot Password?</a>
          </div>

          @if (errorMsg()) {
            <div class="text-rose-600 text-sm text-center bg-rose-50 p-3 rounded-[2rem] border border-rose-200 mb-4 font-medium">
              {{ errorMsg() }}
            </div>
          }

          <div class="flex justify-center">
            <button type="submit" [disabled]="isLoading()" 
              class="flex justify-center items-center w-full max-w-[200px] py-4 px-8 rounded-[2rem] shadow-[0_10px_20px_rgba(37,99,235,0.25)] text-xl font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all active:scale-[0.98]">
               @if (isLoading()) {
                 <mat-icon class="animate-spin text-[28px] w-[28px] h-[28px]">refresh</mat-icon>
               } @else {
                 Login
               }
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class LoginPage {
  authService = inject(AuthService);
  router = inject(Router);
  
  email = '';
  password = '';
  isLoading = signal(false);
  errorMsg = signal('');

  async login() {
    if (!this.email || !this.password) return;
    
    this.isLoading.set(true);
    this.errorMsg.set('');
    
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/admin/dashboard']);
    } catch (error: any) {
      this.errorMsg.set('Username or Password incorrect');
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }
}

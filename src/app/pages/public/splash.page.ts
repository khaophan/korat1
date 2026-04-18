import { Component, inject, OnInit, PLATFORM_ID, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { animate, spring } from 'motion';
import { MatIconModule } from '@angular/material/icon';
import { RouteService } from '../../services/route.service';
import { PlaceService } from '../../services/place.service';

@Component({
  selector: 'app-splash-page',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="h-[100dvh] w-full flex flex-col items-center justify-center bg-white relative overflow-hidden">
      <!-- Minimal native background elements -->
      <div class="absolute inset-0 bg-blue-50/50 pointer-events-none"></div>
      
      <div #logoContainer class="flex flex-col items-center opacity-0 scale-90 relative z-10">
        <!-- Logo Icon Box -> iOS App Icon style -->
        <div class="w-28 h-28 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-[2rem] flex items-center justify-center shadow-[0_15px_35px_rgba(37,99,235,0.3)] mb-6 relative overflow-hidden">
          <div class="absolute inset-0 bg-white/20" style="clip-path: polygon(0 0, 100% 0, 100% 100%);"></div>
          <mat-icon class="text-white text-[56px] w-[56px] h-[56px] z-10 drop-shadow-md">directions_bus</mat-icon>
        </div>
        
        <h1 class="text-5xl font-black tracking-tight text-slate-900 drop-shadow-sm">Korat</h1>
        <p class="text-slate-500 text-center mt-2 font-bold tracking-[0.25em] uppercase text-xs">Transit Map</p>
      </div>

      <div #loader class="absolute bottom-16 w-64 flex flex-col items-center opacity-0 z-10">
        <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <div class="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out" [style.width.%]="displayProgress"></div>
        </div>
        <div class="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
           {{ loadingText }} ({{ displayProgress | number:'1.0-0' }}%)
        </div>
      </div>
    </div>
  `
})
export class SplashPage implements OnInit, AfterViewInit {
  platformId = inject(PLATFORM_ID);
  router = inject(Router);
  routeService = inject(RouteService);
  placeService = inject(PlaceService);

  @ViewChild('logoContainer') logoContainer!: ElementRef;
  @ViewChild('loader') loader!: ElementRef;

  targetProgress = 0;
  displayProgress = 0;
  loadingText = 'กำลังเตรียมระบบ...';
  
  progressInterval: any;
  startTime: number = 0;
  minLoadingTime = 1500; // Minimum splash screen time

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.startTime = Date.now();
      this.startLoadingProcess();
    }
  }

  startLoadingProcess() {
    // Start with a small fast progress to show it's working
    this.targetProgress = 15;
    
    // Smoothly interpolate displayProgress towards targetProgress
    this.progressInterval = setInterval(() => {
      if (this.displayProgress < this.targetProgress) {
        this.displayProgress += (this.targetProgress - this.displayProgress) * 0.1;
        if (this.targetProgress - this.displayProgress < 0.5) {
          this.displayProgress = this.targetProgress;
        }
      }
      
      this.checkDataStatus();
      
    }, 16); // ~60fps
  }
  
  checkDataStatus() {
     let newTarget = 15;
     this.loadingText = 'เชื่อมต่อฐานข้อมูล...';
     
     if (this.routeService.isLoaded()) {
        newTarget += 40;
        this.loadingText = 'กำลังโหลดเส้นทางรถ...';
     }
     
     if (this.placeService.isLoaded()) {
        newTarget += 30;
        this.loadingText = 'กำลังโหลดข้อมูลสถานที่...';
     }
     
     const elapsed = Date.now() - this.startTime;
     
     if (this.routeService.isLoaded() && this.placeService.isLoaded()) {
        if (elapsed > this.minLoadingTime) {
           newTarget = 100;
           this.loadingText = 'พร้อมใช้งาน';
        } else {
           // Still waiting for min time to pass safely
           newTarget = 95;
           this.loadingText = 'เตรียมความพร้อม...';
        }
     }
     
     if (newTarget > this.targetProgress) {
        this.targetProgress = newTarget;
     }
     
     // Finish and navigate
     if (this.displayProgress >= 99 && this.targetProgress === 100) {
        clearInterval(this.progressInterval);
        this.displayProgress = 100;
        
        setTimeout(() => {
           const boarded = localStorage.getItem('korat_boarded');
           if (boarded) {
             this.router.navigate(['/map']);
           } else {
             this.router.navigate(['/onboarding']);
           }
        }, 300); // Tiny final delay before navigation
     }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.logoContainer?.nativeElement) {
        animate(
          this.logoContainer.nativeElement,
          { opacity: [0, 1], scale: [0.8, 1], y: [20, 0] },
          { duration: 0.8, ease: "backOut" }
        );
      }

      if (this.loader?.nativeElement) {
        animate(
          this.loader.nativeElement,
          { opacity: [0, 1] },
          { duration: 0.5, delay: 0.6 }
        );
      }
    }
  }
}

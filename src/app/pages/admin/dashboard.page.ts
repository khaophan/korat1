import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouteService } from '../../services/route.service';
import { ReportService } from '../../services/report.service';
import { PlaceService } from '../../services/place.service';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <div class="space-y-4 pb-6">
      
      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between aspect-square">
          <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <mat-icon>directions_bus</mat-icon>
          </div>
          <div>
            <div class="text-3xl font-black text-slate-800">{{ totalRoutes() }}</div>
            <div class="text-xs font-bold text-slate-400 mt-1">สายรถทั้งหมด</div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between aspect-square relative overflow-hidden">
          <div class="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center relative z-10">
            <mat-icon>report_problem</mat-icon>
          </div>
          <div class="relative z-10">
            <div class="text-3xl font-black" [class.text-amber-500]="pendingReports() > 0" [class.text-slate-800]="pendingReports() === 0">
              {{ pendingReports() }}
            </div>
            <div class="text-xs font-bold text-slate-400 mt-1">รอการตรวจสอบ</div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between aspect-square">
          <div class="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
             <mat-icon>place</mat-icon>
          </div>
          <div>
            <div class="text-3xl font-black text-slate-800">{{ totalPlaces() }}</div>
            <div class="text-xs font-bold text-slate-400 mt-1">จุดสำคัญ</div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-3xl shadow-sm flex flex-col justify-between aspect-square text-white">
          <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
             <mat-icon>check_circle</mat-icon>
          </div>
          <div>
            <div class="text-xl font-black mt-2">ONLINE</div>
            <div class="text-xs font-medium text-blue-100 mt-1">สถานะระบบการเชื่อมต่อ</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 mt-4">
        <h3 class="text-sm font-bold text-slate-800 mb-3 px-1">จัดการข้อมูล</h3>
        <div class="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
          <a routerLink="/admin/routes/edit/new" class="shrink-0 flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 font-bold rounded-2xl active:scale-95 transition-transform">
            <mat-icon class="text-xl">add_road</mat-icon>
            เพิ่มสายรถ
          </a>
          <a routerLink="/admin/places/edit/new" class="shrink-0 flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-2xl active:scale-95 transition-transform">
            <mat-icon class="text-xl">add_location</mat-icon>
            เพิ่มจุดสำคัญ
          </a>
        </div>
      </div>

      <!-- Recent Routes Summary -->
      <div class="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 mt-4">
         <div class="flex justify-between items-end mb-4 px-1">
            <h3 class="text-sm font-bold text-slate-800">สายรถล่าสุด</h3>
            <a routerLink="/admin/routes" class="text-xs font-bold text-blue-500">ดูทั้งหมด</a>
         </div>
         <div class="space-y-3">
            @for (route of routeService.routes().slice(0, 3); track route.id) {
               <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-sm" [style.backgroundColor]="route.color">
                     {{ route.number }}
                  </div>
                  <div class="flex-1">
                     <div class="text-sm font-bold text-slate-800 truncate">{{ route.name }}</div>
                     <div class="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <span class="w-1.5 h-1.5 rounded-full" [class.bg-emerald-400]="route.isActive" [class.bg-slate-300]="!route.isActive"></span>
                        {{ route.isActive ? 'เปิดให้บริการ' : 'ซ่อน' }}
                     </div>
                  </div>
               </div>
            }
            @if (routeService.routes().length === 0) {
               <div class="text-center py-6 text-slate-400 text-sm">ยังไม่มีข้อมูลสายรถ</div>
            }
         </div>
      </div>
    </div>
  `
})
export class DashboardPage {
  routeService = inject(RouteService);
  reportService = inject(ReportService);
  placeService = inject(PlaceService);

  totalRoutes = computed(() => this.routeService.routes().length);
  totalReports = computed(() => this.reportService.reports().length);
  totalPlaces = computed(() => this.placeService.places().length);
  pendingReports = computed(() => this.reportService.reports().filter(r => r.status === 'pending').length);
}

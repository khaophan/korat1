import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RouteService } from '../../services/route.service';
import { ActivityLogService } from '../../services/activity-log.service';
import { MatIconModule } from '@angular/material/icon';
import { Route } from '../../models';

@Component({
  selector: 'app-routes-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="space-y-4">
      <div class="flex justify-between items-center mb-6 px-1">
        <div>
          <h2 class="text-xl font-bold text-slate-800">สายรถทั้งหมด</h2>
          <p class="text-xs text-slate-500">จัดการข้อมูลเส้นทางเดินรถ</p>
        </div>
        <a routerLink="/admin/routes/edit/new" class="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all shadow-sm">
          <mat-icon>add</mat-icon>
        </a>
      </div>

      <div class="grid grid-cols-1 gap-3">
        @for (route of routeService.routes(); track route.id) {
          <div class="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex items-start gap-4 transition-all">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-white text-lg shadow-sm" [style.backgroundColor]="route.color">
              {{ route.number }}
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="font-bold text-slate-800 truncate">{{ route.name }}</div>
                <button (click)="toggleStatus(route)" class="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 mt-0.5 transition-colors" [class.bg-emerald-100]="route.isActive" [class.text-emerald-700]="route.isActive" [class.bg-slate-100]="!route.isActive" [class.text-slate-500]="!route.isActive">
                  {{ route.isActive ? 'เปิดให้บริการ' : 'ซ่อนอยู่' }}
                </button>
              </div>
              <div class="text-[11px] text-slate-500 truncate mt-0.5">{{ route.origin }} - {{ route.destination }}</div>
              
              <div class="flex items-center gap-4 mt-3">
                <a [routerLink]="['/admin/routes/edit', route.id]" class="text-xs font-bold text-blue-600 flex items-center gap-1 active:scale-95 transition-transform">
                  <mat-icon class="text-[16px] w-[16px] h-[16px]">edit</mat-icon> แก้ไข
                </a>
                <button (click)="confirmDelete(route)" class="text-xs font-bold text-rose-500 flex items-center gap-1 active:scale-95 transition-transform">
                  <mat-icon class="text-[16px] w-[16px] h-[16px]">delete</mat-icon> ลบ
                </button>
              </div>
            </div>
          </div>
        }
        
        @if (routeService.routes().length === 0) {
          <div class="bg-white rounded-3xl p-8 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center text-slate-400 mt-4">
            <div class="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full text-slate-300 mb-3">
              <mat-icon class="text-3xl">directions_bus</mat-icon>
            </div>
            <div class="font-bold text-slate-600 mb-1">ยังไม่มีข้อมูลสายรถ</div>
            <div class="text-xs mb-4">เพิ่มข้อมูลสายรถสองแถวของคุณที่นี่</div>
            <a routerLink="/admin/routes/edit/new" class="px-5 py-2 bg-blue-50 text-blue-700 font-bold rounded-full border border-blue-100 hover:bg-blue-100 transition-colors">
              เพิ่มสายรถใหม่
            </a>
          </div>
        }
      </div>

      <!-- Delete Confirmation Modal -->
      @if (routeToDelete()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[500] p-4">
          <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div class="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
              <mat-icon>warning</mat-icon>
            </div>
            <h3 class="text-lg font-bold text-slate-800 mb-2">ยืนยันการลบ</h3>
            <p class="text-sm text-slate-500 mb-6 leading-relaxed">คุณแน่ใจหรือไม่ว่าต้องการลบสายรถ <span class="font-bold text-slate-800">{{ routeToDelete()?.number }} - {{ routeToDelete()?.name }}</span>? <br>การกระทำนี้จะลบทั้งเส้นทางและจุดจอดทั้งหมดทันที</p>
            <div class="flex justify-end gap-3">
              <button (click)="cancelDelete()" class="px-5 py-2.5 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors active:scale-95">
                ยกเลิก
              </button>
              <button (click)="executeDelete()" class="px-5 py-2.5 bg-rose-500 text-white font-bold hover:bg-rose-600 rounded-xl transition-colors active:scale-95">
                ลบทันที
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class RoutesPage {
  routeService = inject(RouteService);
  logService = inject(ActivityLogService);
  
  routeToDelete = signal<Route | null>(null);

  async toggleStatus(route: Route) {
    if (!route.id) return;
    const newStatus = !route.isActive;
    await this.routeService.updateRoute(route.id, { isActive: newStatus });
    await this.logService.logAction('UPDATE_ROUTE_STATUS', `เปลี่ยนสถานะสาย ${route.number} เป็น ${newStatus ? 'เปิด' : 'ซ่อน'}`);
  }

  confirmDelete(route: Route) {
    this.routeToDelete.set(route);
  }

  cancelDelete() {
    this.routeToDelete.set(null);
  }

  async executeDelete() {
    const route = this.routeToDelete();
    if (!route || !route.id) return;
    
    await this.routeService.deleteRoute(route.id);
    await this.logService.logAction('DELETE_ROUTE', `ลบสาย ${route.number}`);
    this.routeToDelete.set(null);
  }
}

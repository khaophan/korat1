import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaceService } from '../../services/place.service';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-places-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <div class="space-y-4">
      <div class="flex justify-between items-center mb-6 px-1">
        <div>
          <h2 class="text-xl font-bold text-slate-800">จุดสำคัญบนแผนที่</h2>
          <p class="text-xs text-slate-500">จัดการข้อมูลสถานที่และจุดสังเกตต่างๆ</p>
        </div>
        <a routerLink="/admin/places/edit/new" class="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all shadow-sm">
          <mat-icon>add</mat-icon>
        </a>
      </div>

      <div class="grid grid-cols-1 gap-3">
        @for (place of placeService.places(); track place.id) {
          <div class="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex items-start gap-4 transition-all">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <mat-icon>{{ place.icon || 'place' }}</mat-icon>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="font-bold text-slate-800 truncate">{{ place.name }}</div>
                <div class="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 mt-0.5" [class.bg-emerald-100]="place.isActive" [class.text-emerald-700]="place.isActive" [class.bg-slate-100]="!place.isActive" [class.text-slate-500]="!place.isActive">
                  {{ place.isActive ? 'แสดงบนแผนที่' : 'ซ่อน' }}
                </div>
              </div>
              <div class="text-xs text-slate-500 truncate mt-1">{{ place.description || 'ไม่มีคำอธิบาย' }}</div>
              
              <div class="flex items-center gap-4 mt-3">
                <a [routerLink]="['/admin/places/edit', place.id]" class="text-xs font-bold text-blue-600 flex items-center gap-1 active:scale-95 transition-transform">
                  <mat-icon class="text-[16px] w-[16px] h-[16px]">edit</mat-icon> แก้ไข
                </a>
                <button (click)="deletePlace(place)" class="text-xs font-bold text-rose-500 flex items-center gap-1 active:scale-95 transition-transform">
                  <mat-icon class="text-[16px] w-[16px] h-[16px]">delete</mat-icon> ลบ
                </button>
              </div>
            </div>
          </div>
        }
        
        @if (placeService.places().length === 0) {
          <div class="bg-white rounded-3xl p-8 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center text-slate-400 mt-4">
            <div class="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full text-slate-300 mb-3">
              <mat-icon class="text-3xl">add_location_alt</mat-icon>
            </div>
            <div class="font-bold text-slate-600 mb-1">ยังไม่มีจุดสำคัญ</div>
            <div class="text-xs mb-4">เพิ่มสถานที่เพื่อแสดงบนแผนที่ให้ผู้โดยสารได้สังเกต</div>
            <a routerLink="/admin/places/edit/new" class="px-5 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors">
              เพิ่มสถานที่แรก
            </a>
          </div>
        }
      </div>
    </div>
  `
})
export class PlacesPage {
  placeService = inject(PlaceService);

  async deletePlace(place: any) {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ ${place.name}?`)) {
      try {
        await this.placeService.deletePlace(place.id!);
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการลบสถานที่');
      }
    }
  }
}

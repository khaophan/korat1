import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../services/report.service';
import { RouteService } from '../../services/route.service';
import { ActivityLogService } from '../../services/activity-log.service';
import { MatIconModule } from '@angular/material/icon';
import { Report } from '../../models';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-800">รายงานปัญหา</h1>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-gray-600">
            <thead class="bg-gray-50 text-gray-700">
              <tr>
                <th class="px-6 py-4 font-medium">วันที่แจ้ง</th>
                <th class="px-6 py-4 font-medium">สายรถ</th>
                <th class="px-6 py-4 font-medium">ประเภทปัญหา</th>
                <th class="px-6 py-4 font-medium">รายละเอียด</th>
                <th class="px-6 py-4 font-medium">สถานะ</th>
                <th class="px-6 py-4 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (report of reportService.reports(); track report.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">{{ report.createdAt | date:'short' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    สาย {{ getRouteNumber(report.routeId) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ report.type }}</td>
                  <td class="px-6 py-4">
                    <p class="truncate max-w-xs" [title]="report.description">{{ report.description }}</p>
                    @if (report.imageURL) {
                      <a [href]="report.imageURL" target="_blank" class="text-blue-600 text-xs flex items-center gap-1 mt-1 hover:underline">
                        <mat-icon class="text-[14px] w-[14px] h-[14px]">image</mat-icon> ดูรูปภาพ
                      </a>
                    }
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium rounded-full"
                          [ngClass]="{
                            'bg-rose-100 text-rose-700': report.status === 'pending',
                            'bg-emerald-100 text-emerald-700': report.status === 'confirmed',
                            'bg-gray-100 text-gray-700': report.status === 'rejected'
                          }">
                      {{ report.status === 'pending' ? 'รอตรวจสอบ' : (report.status === 'confirmed' ? 'ยืนยันแล้ว' : 'ปฏิเสธ') }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    @if (report.status === 'pending') {
                      <button (click)="updateStatus(report, 'confirmed')" class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors text-xs font-medium">
                        <mat-icon class="text-[16px] w-[16px] h-[16px]">check</mat-icon> ยืนยัน
                      </button>
                      <button (click)="updateStatus(report, 'rejected')" class="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md transition-colors text-xs font-medium">
                        <mat-icon class="text-[16px] w-[16px] h-[16px]">close</mat-icon> ปฏิเสธ
                      </button>
                    }
                  </td>
                </tr>
              }
              @if (reportService.reports().length === 0) {
                <tr>
                  <td colspan="6" class="px-6 py-8 text-center text-gray-500">ไม่มีรายงานปัญหา</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ReportsPage {
  reportService = inject(ReportService);
  routeService = inject(RouteService);
  logService = inject(ActivityLogService);

  getRouteNumber(routeId: string): string {
    const route = this.routeService.routes().find(r => r.id === routeId);
    return route ? route.number : 'ไม่ทราบ';
  }

  async updateStatus(report: Report, status: 'confirmed' | 'rejected') {
    if (!report.id) return;
    
    let note = '';
    if (status === 'rejected') {
      note = prompt('ระบุเหตุผลที่ปฏิเสธ (ถ้ามี):') || '';
    }

    await this.reportService.updateReportStatus(report.id, status, note);
    await this.logService.logAction('UPDATE_REPORT', `อัปเดตสถานะรายงาน ${report.id} เป็น ${status}`);
  }
}

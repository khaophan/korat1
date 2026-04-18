import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityLogService } from '../../services/activity-log.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-logs-page',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-800">Activity Log</h1>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-gray-600">
            <thead class="bg-gray-50 text-gray-700">
              <tr>
                <th class="px-6 py-4 font-medium">วันเวลา</th>
                <th class="px-6 py-4 font-medium">การกระทำ</th>
                <th class="px-6 py-4 font-medium">รายละเอียด</th>
                <th class="px-6 py-4 font-medium">Admin ID</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (log of logService.logs(); track log.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">{{ log.timestamp | date:'medium' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-teal-50 text-teal-700">
                      {{ log.action }}
                    </span>
                  </td>
                  <td class="px-6 py-4">{{ log.detail }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">{{ log.adminId }}</td>
                </tr>
              }
              @if (logService.logs().length === 0) {
                <tr>
                  <td colspan="4" class="px-6 py-8 text-center text-gray-500">ไม่มีประวัติการใช้งาน</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class LogsPage {
  logService = inject(ActivityLogService);
}

import { Component, inject, signal, ViewChild, ElementRef, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouteService } from '../../services/route.service';
import { ReportService } from '../../services/report.service';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

@Component({
  selector: 'app-report-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div class="bg-blue-600 p-6 text-white">
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <mat-icon class="text-[24px] w-[24px] h-[24px]">report_problem</mat-icon>
            รายงานปัญหา
          </h1>
          <p class="mt-2 text-blue-100">พบปัญหาการใช้งานรถสองแถว แจ้งให้เราทราบเพื่อปรับปรุงบริการ</p>
        </div>

        <div class="p-6">
          @if (isSubmitted()) {
            <div class="text-center py-12">
              <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <mat-icon class="text-[32px] w-[32px] h-[32px]">check_circle</mat-icon>
              </div>
              <h2 class="text-2xl font-bold text-gray-800 mb-2">ส่งรายงานสำเร็จ</h2>
              <p class="text-gray-600 mb-6">ขอบคุณที่ช่วยแจ้งปัญหา เราจะรีบดำเนินการตรวจสอบโดยเร็วที่สุด</p>
              <button (click)="resetForm()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                ส่งรายงานอีกครั้ง
              </button>
            </div>
          } @else {
            <form (ngSubmit)="submitReport()" class="space-y-6">
              <!-- Type -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">ประเภทปัญหา <span class="text-red-500">*</span></label>
                <select [(ngModel)]="reportData.type" name="type" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">-- เลือกประเภทปัญหา --</option>
                  <option value="สายรถหยุดให้บริการแล้ว">สายรถหยุดให้บริการแล้ว</option>
                  <option value="เส้นทางเปลี่ยนแปลง">เส้นทางเปลี่ยนแปลง</option>
                  <option value="จุดจอดไม่ให้บริการแล้ว">จุดจอดไม่ให้บริการแล้ว</option>
                  <option value="ข้อมูลสีหรือหมายเลขสายผิด">ข้อมูลสีหรือหมายเลขสายผิด</option>
                  <option value="ข้อเสนอแนะอื่น ๆ">ข้อเสนอแนะอื่น ๆ</option>
                </select>
              </div>

              <!-- Route -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">สายรถที่เกี่ยวข้อง <span class="text-red-500">*</span></label>
                <select [(ngModel)]="reportData.routeId" name="routeId" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">-- เลือกสายรถ --</option>
                  @for (route of routeService.routes(); track route.id) {
                    <option [value]="route.id">สาย {{ route.number }} - {{ route.name }}</option>
                  }
                </select>
              </div>

              <!-- Map Position -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">ระบุตำแหน่งบนแผนที่ (ถ้ามี)</label>
                <div class="h-64 rounded-xl border border-gray-200 overflow-hidden relative">
                  <div #mapContainer class="w-full h-full"></div>
                  @if (reportData.position) {
                    <div class="absolute top-2 right-2 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-100 text-sm font-medium text-blue-700 z-[1000]">
                      เลือกตำแหน่งแล้ว
                    </div>
                  }
                </div>
                <p class="text-xs text-gray-500 mt-1">คลิกบนแผนที่เพื่อปักหมุดตำแหน่งที่เกิดปัญหา</p>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">รายละเอียดเพิ่มเติม <span class="text-red-500">*</span></label>
                <textarea [(ngModel)]="reportData.description" name="description" required rows="4" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="อธิบายรายละเอียดปัญหาที่พบ..."></textarea>
              </div>

              <!-- Image -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">แนบภาพถ่ายหลักฐาน (ถ้ามี)</label>
                <input type="file" (change)="onFileSelected($event)" accept="image/*" class="w-full p-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
              </div>

              <!-- Submit -->
              <div class="pt-4">
                <button type="submit" [disabled]="isSubmitting() || !reportData.type || !reportData.routeId || !reportData.description" class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                  @if (isSubmitting()) {
                    <mat-icon class="animate-spin mr-2 text-[20px] w-[20px] h-[20px]">refresh</mat-icon> กำลังส่งข้อมูล...
                  } @else {
                    <mat-icon class="mr-2 text-[20px] w-[20px] h-[20px]">send</mat-icon> ส่งรายงานปัญหา
                  }
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    </div>
  `
})
export class ReportPage implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  routeService = inject(RouteService);
  reportService = inject(ReportService);
  platformId = inject(PLATFORM_ID);
  
  L: any;
  map!: any;
  marker: any = null;
  
  isSubmitting = signal(false);
  isSubmitted = signal(false);
  selectedFile: File | null = null;
  
  reportData = {
    type: '',
    routeId: '',
    position: null as { lat: number, lng: number } | null,
    description: ''
  };

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.L = await import('leaflet');
      this.initMap();
    }
  }

  initMap() {
    if (!this.L) return;
    this.map = this.L.map(this.mapContainer.nativeElement).setView([14.9799, 102.0978], 13);
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: any) => {
      this.reportData.position = { lat: e.latlng.lat, lng: e.latlng.lng };
      
      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        this.marker = this.L.marker(e.latlng).addTo(this.map);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async submitReport() {
    if (!this.reportData.type || !this.reportData.routeId || !this.reportData.description) return;
    
    this.isSubmitting.set(true);
    try {
      let imageURL = '';
      if (this.selectedFile) {
        const fileRef = ref(storage, `reports/${Date.now()}_${this.selectedFile.name}`);
        await uploadBytes(fileRef, this.selectedFile);
        imageURL = await getDownloadURL(fileRef);
      }

      await this.reportService.addReport({
        ...this.reportData,
        imageURL,
        status: 'pending'
      });
      
      this.isSubmitted.set(true);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('เกิดข้อผิดพลาดในการส่งรายงาน กรุณาลองใหม่อีกครั้ง');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  resetForm() {
    this.reportData = { type: '', routeId: '', position: null, description: '' };
    this.selectedFile = null;
    this.isSubmitted.set(false);
    if (this.marker) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
    if (this.map) {
      this.map.setView([14.9799, 102.0978], 13);
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}

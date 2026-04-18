import { Component, inject, signal, OnInit, OnDestroy, ElementRef, ViewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlaceService } from '../../services/place.service';
import { Place } from '../../models';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-place-editor-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="h-[100dvh] flex flex-col bg-slate-50 relative overflow-hidden">
      <!-- Fixed Header -->
      <div class="flex-none bg-indigo-600 shadow-md z-30 pt-safe px-4 py-3 flex justify-between items-center shrink-0">
        <div class="flex items-center gap-3">
          <button (click)="cancel()" class="p-2 -ml-2 rounded-full text-indigo-100 hover:bg-indigo-700 transition-colors">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="text-xl font-bold text-white tracking-tight">{{ isNew ? 'เพิ่มจุดสำคัญ' : 'แก้ไขจุดสำคัญ' }}</h1>
        </div>
        <button (click)="save()" [disabled]="isSaving()" class="px-5 py-2 bg-white text-indigo-700 font-bold rounded-full shadow-sm hover:bg-indigo-50 active:scale-95 transition-all disabled:opacity-50">
          {{ isSaving() ? 'กำลังบันทึก...' : 'บันทึก' }}
        </button>
      </div>

      <!-- Map Area for Pinning Location -->
      <div class="flex-shrink-0 h-[40dvh] relative z-0 border-b border-slate-200">
        <div #mapContainer class="w-full h-full"></div>
        <div class="absolute bottom-4 left-0 right-0 z-[400] flex justify-center pointer-events-none">
          <div class="bg-slate-900/80 backdrop-blur text-white text-xs px-4 py-2 rounded-full shadow-lg font-medium pointer-events-auto shadow-indigo-900/20">
            แตะบนแผนที่เพื่อปักหมุด
          </div>
        </div>
      </div>

      <!-- Scrollable Form Content -->
      <div class="flex-1 overflow-y-auto min-h-0 p-5 custom-scrollbar pb-40 bg-slate-50">
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">ชื่อสถานที่</label>
            <input type="text" [(ngModel)]="placeData.name" placeholder="เช่น อนุสาวรีย์ท้าวสุรนารี" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner">
          </div>

          <div>
             <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">คำอธิบายสั้นๆ (ไม่บังคับ)</label>
             <textarea [(ngModel)]="placeData.description" rows="2" placeholder="รายละเอียดพิกัด" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner resize-none"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div>
               <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">ไอคอน (Material)</label>
               <input type="text" [(ngModel)]="placeData.icon" placeholder="เช่น place" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner">
             </div>
             <div>
               <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">ประเภท</label>
               <select [(ngModel)]="placeData.type" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner appearance-none">
                 <option value="landmark">แลนด์มาร์ค</option>
                 <option value="transit">จุดเปลี่ยนรถ</option>
                 <option value="mall">ห้างสรรพสินค้า</option>
                 <option value="hospital">โรงพยาบาล</option>
                 <option value="school">สถานศึกษา</option>
               </select>
             </div>
          </div>
          
          <div class="pt-3 flex items-center justify-between border-t border-slate-50">
            <div>
               <span class="text-sm font-bold text-slate-800 block">แสดงบนแผนที่</span>
               <span class="text-xs text-slate-500">เปิดเพื่อให้ผู้โดยสารมองเห็นจุดนี้</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" [(ngModel)]="placeData.isActive" class="sr-only peer">
              <div class="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          <div class="pt-3 border-t border-slate-50 text-xs text-slate-400 font-mono flex justify-between">
             <span>LAT: {{ placeData.lat | number:'1.5-5' }}</span>
             <span>LNG: {{ placeData.lng | number:'1.5-5' }}</span>
          </div>

        </div>
      </div>
    </div>
  `
})
export class PlaceEditorPage implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  placeService = inject(PlaceService);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  platformId = inject(PLATFORM_ID);

  L: any;
  map!: any;
  markerLayer: any;
  
  isNew = true;
  placeId: string | null = null;
  isSaving = signal(false);

  placeData: Place = {
    name: '',
    description: '',
    lat: 14.9799,
    lng: 102.0978,
    icon: 'place',
    type: 'landmark',
    isActive: true
  };

  async ngOnInit() {
    this.placeId = this.activatedRoute.snapshot.paramMap.get('id');
    this.isNew = !this.placeId || this.placeId === 'new';
    
    if (isPlatformBrowser(this.platformId)) {
      this.L = await import('leaflet');
      await this.initMap();
    }
  }

  async initMap() {
    if (!this.L) return;
    
    if (!this.isNew && this.placeId) {
      await this.loadPlaceData();
    }
    
    const center = [this.placeData.lat, this.placeData.lng];
    
    this.map = this.L.map(this.mapContainer.nativeElement, {
        maxZoom: 22,
        zoomControl: false 
    }).setView(center, 15);

    this.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxNativeZoom: 19,
      maxZoom: 22,
      attribution: '&copy; CartoDB'
    }).addTo(this.map);

    this.updateMarker();

    this.map.on('click', (e: any) => {
      this.placeData.lat = e.latlng.lat;
      this.placeData.lng = e.latlng.lng;
      this.updateMarker();
    });
  }

  updateMarker() {
     if (this.markerLayer) {
        this.map.removeLayer(this.markerLayer);
     }
     
     const markerSvg = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C11.163 0 4 7.163 4 16C4 28 20 40 20 40C20 40 36 28 36 16C36 7.163 28.837 0 20 0Z" fill="#4F46E5" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.2))"/>
        <circle cx="20" cy="16" r="8" fill="#FFFFFF"/>
     </svg>`;
     const iconUrl = 'data:image/svg+xml;base64,' + btoa(markerSvg);
     const icon = this.L.icon({ iconUrl, iconSize: [40, 40], iconAnchor: [20, 40] });

     this.markerLayer = this.L.marker([this.placeData.lat, this.placeData.lng], { icon, draggable: true })
        .addTo(this.map);
        
     this.markerLayer.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        this.placeData.lat = pos.lat;
        this.placeData.lng = pos.lng;
     });
     
     this.map.panTo([this.placeData.lat, this.placeData.lng]);
  }

  async loadPlaceData() {
    const place = this.placeService.places().find(p => p.id === this.placeId);
    if (place) {
      this.placeData = { ...place };
    } else {
       // if not found in cache immediately, wait a bit or it might have failed
       // Typically in a full app we'd fetch directly if not in signal.
    }
  }

  async save() {
    if (!this.placeData.name || !this.placeData.lat || !this.placeData.lng) {
        alert('กรุณากรอกและปักหมุดข้อมูลให้ครบถ้วน');
        return;
    }

    this.isSaving.set(true);
    
    try {
      if (this.isNew) {
        await this.placeService.addPlace(this.placeData);
      } else if (this.placeId) {
        await this.placeService.updatePlace(this.placeId, this.placeData);
      }
      this.router.navigate(['/admin/places']);
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/admin/places']);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}

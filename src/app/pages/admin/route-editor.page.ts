import { Component, inject, signal, OnInit, OnDestroy, ElementRef, ViewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteService } from '../../services/route.service';
import { ActivityLogService } from '../../services/activity-log.service';
import { Route } from '../../models';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-route-editor-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 flex flex-col bg-slate-50 z-[1000] overflow-hidden">
      <!-- Fixed Header -->
      <div class="flex-none bg-blue-600 shadow-md z-30 pt-safe px-4 py-3 flex justify-between items-center shrink-0">
        <div class="flex items-center gap-3">
          <button (click)="cancel()" class="p-2 -ml-2 rounded-full text-blue-100 hover:bg-blue-700 transition-colors">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="text-xl font-bold text-white tracking-tight">{{ isNew ? 'สร้างเส้นทางใหม่' : 'แก้ไขเส้นทาง' }}</h1>
        </div>
        <button (click)="save()" [disabled]="isSaving()" class="px-5 py-2 bg-white text-blue-700 font-bold rounded-full shadow-sm hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-50">
          {{ isSaving() ? 'กำลังบันทึก...' : 'บันทึก' }}
        </button>
      </div>

      <!-- Map Area (Top Half) -->
      <div class="flex-shrink-0 h-[45dvh] relative z-0 border-b border-slate-200">
        <div #mapContainer class="w-full h-full"></div>
        
        <!-- Floating Tools over Map -->
        <div class="absolute bottom-4 right-4 z-[400] flex flex-col gap-2">
          <button (click)="undoLastSegment()" *ngIf="routeSegments.length > 0 && drawMode() === 'path'" class="w-12 h-12 bg-white rounded-full shadow-xl text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors border border-slate-100">
            <mat-icon>undo</mat-icon>
          </button>
        </div>
      </div>

      <!-- Bottom Sheet Panel (Bottom Half) -->
      <div class="flex-1 flex flex-col bg-slate-50 z-20 relative min-h-0">
        <!-- Tabs -->
        <div class="flex items-center p-2 bg-white border-b border-slate-200 shrink-0 shadow-sm">
          <button (click)="drawMode.set('info')" [class]="drawMode() === 'info' ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-slate-500 font-medium hover:bg-slate-50'" class="flex-1 py-3 px-2 rounded-xl transition-all flex justify-center items-center gap-2">
            <mat-icon class="text-[20px] w-[20px] h-[20px]">info</mat-icon> ข้อมูล
          </button>
          <button (click)="drawMode.set('path')" [class]="drawMode() === 'path' ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-slate-500 font-medium hover:bg-slate-50'" class="flex-1 py-3 px-2 rounded-xl transition-all flex justify-center items-center gap-2">
            <mat-icon class="text-[20px] w-[20px] h-[20px]">timeline</mat-icon> วาดเส้นทาง
          </button>
          <button (click)="drawMode.set('stop')" [class]="drawMode() === 'stop' ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-slate-500 font-medium hover:bg-slate-50'" class="flex-1 py-3 px-2 rounded-xl transition-all flex justify-center items-center gap-2">
            <mat-icon class="text-[20px] w-[20px] h-[20px]">room</mat-icon> จุดจอด
          </button>
        </div>

        <!-- Scrollable Forms Content -->
        <div class="flex-1 overflow-y-auto min-h-0 p-5 custom-scrollbar pb-40">
          
          <!-- Mode: INFO -->
          <div *ngIf="drawMode() === 'info'" class="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div class="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">สายรถ</label>
                  <div class="flex gap-2">
                    <input type="text" [(ngModel)]="routeData.number" placeholder="เช่น 1, 2, 3" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner text-center">
                  </div>
                </div>
                <div>
                   <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">สีเส้นทาง</label>
                   <input type="color" [(ngModel)]="routeData.color" (change)="updateMapStyle()" class="w-full h-12 p-1 border border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                </div>
              </div>
              
              <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div class="flex items-center justify-between mb-2 px-1">
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">สีตัวรถ (เพิ่มเติม)</label>
                  <button type="button" (click)="addVehicleColor()" class="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors flex items-center gap-1">
                    <mat-icon class="text-[14px] w-[14px] h-[14px]">add</mat-icon> เพิ่มสี
                  </button>
                </div>
                
                @if (routeData.vehicleColors && routeData.vehicleColors.length > 0) {
                  <div class="flex flex-wrap gap-2">
                    @for(color of routeData.vehicleColors; track $index) {
                      <div class="relative flex items-center group">
                        <input type="color" [ngModel]="color" (ngModelChange)="updateVehicleColor($index, $event)" class="h-10 w-12 p-1 gap-2 border border-slate-200 rounded-xl cursor-pointer bg-white shadow-sm">
                        <button type="button" (click)="removeVehicleColor($index)" class="absolute -top-2 -right-2 w-5 h-5 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 shadow-sm rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform">
                           <mat-icon class="text-[12px] w-[12px] h-[12px]">close</mat-icon>
                        </button>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-xs text-slate-400 px-1">สามารถกำหนดสีเพิ่มได้หากรถมีมากกว่า 1 สี</p>
                }
              </div>
              
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">ชื่อเส้นทาง</label>
                <input type="text" [(ngModel)]="routeData.name" placeholder="เช่น มทส. - บขส. ใหม่" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">ต้นทาง</label>
                  <input type="text" [(ngModel)]="routeData.origin" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">ปลายทาง</label>
                  <input type="text" [(ngModel)]="routeData.destination" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner">
                </div>
              </div>
              
              <div class="pt-2 flex items-center justify-between border-t border-slate-50">
                <span class="text-sm font-bold text-slate-700">สถานะเปิดให้บริการ</span>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" [(ngModel)]="routeData.isActive" class="sr-only peer">
                  <div class="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
            </div>
          </div>

          <!-- Mode: PATH -->
          <div *ngIf="drawMode() === 'path'" class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center justify-center text-center py-4">
             
             <!-- Toggle Routing Mode -->
             <div class="w-full bg-slate-100 p-1.5 rounded-2xl flex items-center mb-2">
                <button (click)="setPathMode('smart')" [class]="pathMode() === 'smart' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-500 font-medium hover:bg-slate-200'" class="flex-1 py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5">
                  <mat-icon class="text-[18px] w-[18px] h-[18px]">alt_route</mat-icon> ปักหมุด (Auto)
                </button>
                <button (click)="setPathMode('freehand')" [class]="pathMode() === 'freehand' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-500 font-medium hover:bg-slate-200'" class="flex-1 py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5">
                  <mat-icon class="text-[18px] w-[18px] h-[18px]">gesture</mat-icon> วาดอิสระ
                </button>
             </div>

             @if(pathMode() === 'smart') {
               <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-2 relative">
                 <mat-icon class="text-[32px] w-[32px] h-[32px]" [class.animate-pulse]="isCalculating()">touch_app</mat-icon>
                 @if (isCalculating()) {
                    <div class="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                 }
               </div>
               <h3 class="text-slate-800 font-bold text-lg">ปักหมุดเพื่อสร้างเส้นทาง</h3>
               <p class="text-slate-500 text-sm max-w-[280px]">แตะแผนที่ตามทางแยก ระบบจะคำนวณเส้นทางตามถนนจริงให้อัตโนมัติ</p>
             } @else {
               <div class="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-2">
                 <mat-icon class="text-[32px] w-[32px] h-[32px]">draw</mat-icon>
               </div>
               <h3 class="text-slate-800 font-bold text-lg">ใช้นิ้ววาดเส้นทาง</h3>
               <p class="text-slate-500 text-sm max-w-[280px]">ใช้นิ้วเดียวลากเพื่อวาดเส้นทาง หากต้องการเลื่อนหรือซูมแผนที่ ให้ใช้ 2 นิ้วพร้อมกัน</p>
             }
             
             <button (click)="clearPath()" class="mt-4 px-6 py-3 border border-rose-200 text-rose-500 bg-rose-50 font-bold rounded-full hover:bg-rose-100 transition-colors shadow-sm flex items-center gap-2">
               <mat-icon class="text-[20px] w-[20px] h-[20px]">delete_sweep</mat-icon> ล้างข้อมูลที่วาดไว้
             </button>
          </div>

          <!-- Mode: STOP -->
          <div *ngIf="drawMode() === 'stop'" class="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div class="flex justify-between items-end mb-4 px-1">
                <div>
                   <h3 class="text-slate-800 font-bold text-lg">จุดจอดรับส่ง</h3>
                   <p class="text-slate-500 text-sm">แตะบนแผนที่เพื่อเพิ่มจัดจอด</p>
                </div>
                <button type="button" (click)="clearWaypoints()" class="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-xs font-bold hover:bg-rose-100 transition-colors shadow-sm">ล้างทั้งหมด</button>
             </div>
             
             <div class="space-y-3">
                @for (wp of routeData.waypoints; track $index) {
                  <div class="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {{ $index + 1 }}
                    </div>
                    <input type="text" [(ngModel)]="wp.name" class="flex-1 bg-transparent border-0 border-b border-dashed border-slate-300 focus:border-blue-500 px-1 py-2 text-slate-800 font-medium focus:ring-0 outline-none">
                    <button type="button" (click)="removeWaypoint($index)" class="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0">
                      <mat-icon class="text-[20px] w-[20px] h-[20px]">close</mat-icon>
                    </button>
                  </div>
                }
                @if (routeData.waypoints.length === 0) {
                  <div class="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                    <mat-icon class="opacity-30 text-5xl mb-2">room</mat-icon>
                    <p class="font-medium text-sm">ยังไม่มีจุดจอด</p>
                  </div>
                }
             </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class RouteEditorPage implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  routeService = inject(RouteService);
  logService = inject(ActivityLogService);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  platformId = inject(PLATFORM_ID);

  L: any;
  map!: any;
  pathLayerGroup: any;
  routePolyline!: any;
  markerLayerGroup: any;
  anchorLayerGroup: any;
  
  isNew = true;
  routeId: string | null = null;
  isSaving = signal(false);
  isCalculating = signal(false);
  drawMode = signal<'info' | 'path' | 'stop'>('info');
  pathMode = signal<'smart' | 'freehand'>('smart');

  routeSegments: { lat: number, lng: number }[][] = [];
  smartAnchors: { lat: number, lng: number }[] = [];
  
  // Freehand drawing states
  isFreehandDrawing = false;
  currentFreehandSegment: { lat: number, lng: number }[] = [];

  routeData: Route = {
    number: '',
    name: '',
    color: '#007AFF', // iOS bright blue default
    origin: '',
    destination: '',
    waypoints: [],
    geojson: '',
    isActive: true
  };

  async ngOnInit() {
    this.routeId = this.activatedRoute.snapshot.paramMap.get('id');
    this.isNew = !this.routeId || this.routeId === 'new';
    
    if (isPlatformBrowser(this.platformId)) {
      this.L = await import('leaflet');
      (window as any).L = this.L;
      await import('leaflet-polylineoffset');
      
      this.initMap();

      if (!this.isNew && this.routeId) {
        this.loadRouteData();
      }
    }
  }

  setPathMode(mode: 'smart' | 'freehand') {
    this.pathMode.set(mode);
  }

  addVehicleColor() {
    if (!this.routeData.vehicleColors) {
       this.routeData.vehicleColors = [];
    }
    this.routeData.vehicleColors.push('#ffffff');
  }

  updateVehicleColor(index: number, color: string) {
    if (this.routeData.vehicleColors) {
       this.routeData.vehicleColors[index] = color;
    }
  }

  removeVehicleColor(index: number) {
    if (this.routeData.vehicleColors) {
       this.routeData.vehicleColors.splice(index, 1);
    }
  }

  initMap() {
    if (!this.L) return;
    const koratCenter = [14.9799, 102.0978];
    
    // Setup map with standard touch interactions enabled initially
    this.map = this.L.map(this.mapContainer.nativeElement, {
        maxZoom: 22,
        zoomControl: false,
        dragging: true, // we will toggle this for freehand
        tap: true
    }).setView(koratCenter, 14);

    this.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxNativeZoom: 19,
      maxZoom: 22,
      attribution: '&copy; CartoDB'
    }).addTo(this.map);

    this.markerLayerGroup = this.L.layerGroup().addTo(this.map);
    this.pathLayerGroup = this.L.layerGroup().addTo(this.map);
    // Group for small anchor dots
    this.anchorLayerGroup = this.L.layerGroup().addTo(this.map);
    
    this.routePolyline = this.L.polyline([], {
      color: this.routeData.color,
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      offset: 4
    }).addTo(this.pathLayerGroup);

    // Native touch handling for Freehand mode
    const mapEl = this.mapContainer.nativeElement;

    mapEl.addEventListener('touchstart', (e: TouchEvent) => {
      if (this.drawMode() === 'path' && this.pathMode() === 'freehand') {
        if (e.touches.length === 1) {
           this.map.dragging.disable();
           this.isFreehandDrawing = true;
           
           // Convert client coords to latlng
           const rect = mapEl.getBoundingClientRect();
           const x = e.touches[0].clientX - rect.left;
           const y = e.touches[0].clientY - rect.top;
           const latlng = this.map.containerPointToLatLng([x, y]);
           
           this.currentFreehandSegment = [{ lat: latlng.lat, lng: latlng.lng }];
           
           // Create a temporary uncommitted segment line for real-time feedback
           this.routeSegments.push(this.currentFreehandSegment);
        } else {
           // 2+ fingers: allow zooming/panning
           this.isFreehandDrawing = false;
           this.map.dragging.enable();
        }
      }
    }, {passive: false});

    mapEl.addEventListener('touchmove', (e: TouchEvent) => {
      if (this.isFreehandDrawing && this.drawMode() === 'path' && this.pathMode() === 'freehand') {
         if (e.touches.length === 1) {
            e.preventDefault(); // prevent scrolling while drawing
            e.stopPropagation();
            
            const rect = mapEl.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const y = e.touches[0].clientY - rect.top;
            const latlng = this.map.containerPointToLatLng([x, y]);
            
            this.currentFreehandSegment.push({ lat: latlng.lat, lng: latlng.lng });
            
            // Re-render real-time
            this.renderPolylines();
         }
      }
    }, {passive: false});

    mapEl.addEventListener('touchend', (e: TouchEvent) => {
       if (this.isFreehandDrawing) {
         this.isFreehandDrawing = false;
         this.map.dragging.enable(); // Re-enable standard dragging
         
         // Cleanup empty segments
         if (this.currentFreehandSegment.length < 2) {
             this.routeSegments.pop();
         }
         this.currentFreehandSegment = [];
         this.renderPolylines();
       }
    });

    // Handle mouse/pointer clicks on map for Smart route & Stops
    this.map.on('click', (e: any) => {
      if (this.drawMode() === 'path' && this.pathMode() === 'freehand') return; // Handled by touch events
      this.handleMapClick(e.latlng.lat, e.latlng.lng);
    });
    
    // Also support mouse drag for desktop debugging of freehand
    this.map.on('mousedown', (e: any) => {
       if (this.drawMode() === 'path' && this.pathMode() === 'freehand') {
          this.map.dragging.disable();
          this.isFreehandDrawing = true;
          this.currentFreehandSegment = [{lat: e.latlng.lat, lng: e.latlng.lng}];
          this.routeSegments.push(this.currentFreehandSegment);
       }
    });
    this.map.on('mousemove', (e: any) => {
       if (this.isFreehandDrawing && this.drawMode() === 'path' && this.pathMode() === 'freehand') {
          this.currentFreehandSegment.push({lat: e.latlng.lat, lng: e.latlng.lng});
          this.renderPolylines();
       }
    });
    this.map.on('mouseup', (e: any) => {
       if (this.isFreehandDrawing) {
          this.isFreehandDrawing = false;
          this.map.dragging.enable();
          if (this.currentFreehandSegment.length < 2) {
              this.routeSegments.pop();
          }
          this.currentFreehandSegment = [];
          this.renderPolylines();
       }
    });
  }

  async handleMapClick(lat: number, lng: number) {
    if (this.drawMode() === 'stop') {
        this.addWaypoint(lat, lng);
    } else if (this.drawMode() === 'path') {
        await this.addPathNode(lat, lng);
    }
  }

  async addPathNode(lat: number, lng: number) {
    if (this.isCalculating()) return;
    this.isCalculating.set(true);

    if (this.routeSegments.length === 0) {
        this.routeSegments.push([{ lat, lng }]);
        this.smartAnchors.push({ lat, lng });
        this.renderPolylines();
        this.isCalculating.set(false);
        return;
    }

    const lastSeg = this.routeSegments[this.routeSegments.length - 1];
    const prevPoint = lastSeg[lastSeg.length - 1];
    
    // Add visual anchor immediately
    this.smartAnchors.push({ lat, lng });
    this.renderPolylines();

    try {
       const curSegCoords = await this.fetchOSRMRoute(prevPoint, {lat, lng});
       this.routeSegments.push(curSegCoords);
    } catch(e) {
       // fallback straight line
       this.routeSegments.push([{lat: prevPoint.lat, lng: prevPoint.lng}, {lat, lng}]);
    }
    this.renderPolylines();
    this.isCalculating.set(false);
  }

  async fetchOSRMRoute(start: {lat:number, lng:number}, end: {lat:number, lng:number}): Promise<{lat:number, lng:number}[]> {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full`;
      try {
          const res = await fetch(url);
          const data = await res.json();
          if (data && data.routes && data.routes.length > 0) {
              const coords = data.routes[0].geometry.coordinates;
              return coords.map((c: number[]) => ({ lat: c[1], lng: c[0] }));
          }
      } catch (e) {
          console.warn('OSRM request failed, drawing straight line', e);
      }
      return [start, end];
  }

  undoLastSegment() {
      if (this.routeSegments.length > 0) {
          this.routeSegments.pop();
          if (this.pathMode() === 'smart' && this.smartAnchors.length > 0) {
             this.smartAnchors.pop();
          }
          this.renderPolylines();
      }
  }

  clearPath() {
      if(confirm('คุณแน่ใจว่าต้องการลบเส้นทางที่วาดไว้ทั้งหมด?')) {
          this.routeSegments = [];
          this.smartAnchors = [];
          this.renderPolylines();
      }
  }

  renderPolylines() {
      if (!this.L) return;
      
      this.anchorLayerGroup.clearLayers();

      const flatCoords: {lat:number, lng:number}[] = [];
      this.routeSegments.forEach(seg => {
          seg.forEach(point => flatCoords.push(point));
      });

      const latlngArr = flatCoords.map(c => [c.lat, c.lng]);
      this.routePolyline.setLatLngs(latlngArr);
      this.routePolyline.setStyle({ color: this.routeData.color, offset: 4 });

      // Draw smart anchor nodes
      if (this.drawMode() === 'path' && this.pathMode() === 'smart') {
         this.smartAnchors.forEach(node => {
            this.L.circleMarker([node.lat, node.lng], {
               radius: 4,
               fillColor: '#ffffff',
               color: this.routeData.color,
               weight: 3,
               fillOpacity: 1
            }).addTo(this.anchorLayerGroup);
         });
      }

      if (latlngArr.length > 1) {
          const feature = this.routePolyline.toGeoJSON();
          this.routeData.geojson = JSON.stringify(feature);
      } else {
          this.routeData.geojson = '';
      }
  }

  addWaypoint(lat: number, lng: number) {
    this.routeData.waypoints.push({
      lat,
      lng,
      name: `จุดจอดที่ ${this.routeData.waypoints.length + 1}`
    });
    this.updateMarkerLayers();
  }

  removeWaypoint(index: number) {
    this.routeData.waypoints.splice(index, 1);
    this.updateMarkerLayers();
  }

  clearWaypoints() {
    if(confirm('ล้างจุดจอดทั้งหมด?')) {
        this.routeData.waypoints = [];
        this.updateMarkerLayers();
    }
  }

  updateMarkerLayers() {
    if (!this.L) return;
    
    this.markerLayerGroup.clearLayers();
    
    this.routeData.waypoints.forEach((wp, index) => {
      const markerSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="#ffffff" stroke="${this.routeData.color}" stroke-width="4" stroke-opacity="0.9" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.2))"/>
        <circle cx="16" cy="16" r="6" fill="${this.routeData.color}"/>
      </svg>`;
      const iconUrl = 'data:image/svg+xml;base64,' + btoa(markerSvg);
      const icon = this.L.icon({ iconUrl, iconSize: [32,32], iconAnchor: [16,16] });

      this.L.marker([wp.lat, wp.lng], { icon })
        .bindTooltip((index + 1).toString(), { permanent: true, direction: 'center', className: 'bg-transparent border-0 text-gray-800 font-extrabold shadow-none text-xs -mt-[1px]' })
        .addTo(this.markerLayerGroup);
    });
  }

  loadRouteData() {
    const route = this.routeService.routes().find(r => r.id === this.routeId);
    if (route) {
      this.routeData = { ...route, waypoints: [...route.waypoints] };
      
      this.updateMarkerLayers();
      
      if (this.routeData.geojson) {
          try {
              const feat = JSON.parse(this.routeData.geojson);
              if (feat && feat.geometry && feat.geometry.coordinates) {
                 const coords = feat.geometry.coordinates;
                 const converted: {lat:number, lng:number}[] = coords.map((c:number[]) => ({ lat: c[1], lng: c[0] }));
                 
                 this.routeSegments = [converted];
                 if (converted.length > 0) {
                     this.smartAnchors = [converted[0], converted[converted.length - 1]];
                 }
                 this.renderPolylines();

                 const bounds = this.L.latLngBounds(converted.map(c => [c.lat, c.lng]));
                 this.map.fitBounds(bounds, { padding: [50, 50] });
              }
          } catch(e) { console.error('Error parsing geojson', e); }
      }
    }
  }

  updateMapStyle() {
    this.renderPolylines();
    this.updateMarkerLayers();
  }

  async save() {
    if (!this.routeData.number || !this.routeData.name || !this.routeData.origin) {
        alert('กรุณากรอกข้อมูลพื้นฐานให้ครบถ้วน');
        this.drawMode.set('info');
        return;
    }

    this.isSaving.set(true);
    
    try {
      if (this.isNew) {
        await this.routeService.addRoute(this.routeData);
        await this.logService.logAction('CREATE_ROUTE', `เพิ่มสาย ${this.routeData.number}`);
      } else if (this.routeId) {
        await this.routeService.updateRoute(this.routeId, this.routeData);
        await this.logService.logAction('UPDATE_ROUTE', `แก้ไขสาย ${this.routeData.number}`);
      }
      this.router.navigate(['/admin/routes']);
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/admin/routes']);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}

import { Component, OnInit, OnDestroy, inject, signal, effect, ElementRef, ViewChild, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouteService } from '../../services/route.service';
import { PlaceService } from '../../services/place.service';
import { Route, Place } from '../../models';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { animate, spring, stagger } from 'motion';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="relative w-full h-[calc(100dvh-64px)] md:h-[calc(100dvh-64px)] flex flex-col md:flex-row overflow-hidden bg-slate-50">
      
      <!-- Map Container -->
      <div class="absolute inset-0 z-0">
        <div #mapContainer class="w-full h-full"></div>
      </div>

      <!-- Mobile Search Bar (Floating Top with Glassmorphism) -->
      <div #searchBar class="md:hidden absolute top-4 left-4 right-4 z-[400]">
        <div class="bg-white/95 backdrop-blur-3xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/60 flex items-center px-4 py-2 transition-all focus-within:bg-white focus-within:shadow-xl">
          <mat-icon class="text-blue-500 mr-2">search</mat-icon>
          <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="filterRoutes()" placeholder="ค้นหาสายรถ, สถานที่..." class="flex-1 bg-transparent border-none focus:ring-0 text-base outline-none text-slate-800 placeholder-slate-400 font-medium h-[40px] px-1">
          <button (click)="toggleBottomSheet()" class="ml-2 bg-blue-50 text-blue-600 p-2 rounded-full hover:bg-blue-100 transition-colors shadow-sm">
            <mat-icon>menu</mat-icon>
          </button>
        </div>
      </div>

      <!-- Desktop Sidebar -->
      <div class="hidden md:flex w-96 bg-white/90 backdrop-blur-3xl shadow-[5px_0_30px_rgba(0,0,0,0.05)] z-20 flex-col h-full border-r border-slate-200/50">
        <div class="p-8 border-b border-blue-500/10 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white relative flex-shrink-0 overflow-hidden">
          <!-- Abstract Background Lines -->
          <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: radial-gradient(circle at top right, rgba(255,255,255,0.4) 0%, transparent 60%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.4) 0%, transparent 50%); mix-blend-mode: overlay;"></div>
          
          <h2 class="text-[32px] font-black mb-6 tracking-tight drop-shadow-sm relative z-10">KORAT MAP</h2>
          
          <div class="relative z-10 mt-2" *ngIf="!selectedRouteId()">
            <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="filterRoutes()" placeholder="ค้นหาสถานที่, สายรถ..." class="w-full pl-11 pr-4 py-3.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-medium shadow-inner">
            <mat-icon class="absolute left-3 top-3.5 text-blue-100">search</mat-icon>
          </div>

          <div *ngIf="selectedRouteId()" class="relative z-10 mt-2">
            <button (click)="selectedRouteId.set(null); updateMapLayers(routeService.routes())" class="flex items-center gap-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all w-full font-bold">
               <mat-icon>arrow_back</mat-icon> กลับไปรายการทั้งหมด
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-50/50">
          <ng-container *ngTemplateOutlet="selectedRouteId() ? routeDetails : routeList"></ng-container>
        </div>
      </div>

      <!-- Mobile Bottom Sheet (iOS Style) -->
      <div #bottomSheet class="md:hidden absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-3xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[500] border-t border-slate-200/50 flex flex-col transition-all duration-300"
           [style.height]="isBottomSheetOpen || selectedRouteId() ? '85dvh' : '90px'"
           [style.transform]="'translateY(0)'">
        
        <!-- Drag Handle Area -->
        <div class="pt-4 pb-4 flex justify-center cursor-pointer shrink-0" (click)="toggleBottomSheet()">
          <div class="w-16 h-1.5 bg-slate-300/80 rounded-full"></div>
        </div>
        
        <!-- Header -->
        <div class="px-6 pb-4 flex justify-between items-center shrink-0 border-b border-slate-100" (click)="toggleBottomSheet()">
          <div>
            <h2 class="font-extrabold text-[22px] text-slate-900 tracking-tight">{{ selectedRouteId() ? 'ข้อมูลสายรถ' : 'สายรถสองแถว' }}</h2>
            <p class="text-xs text-blue-600 font-bold uppercase tracking-wider mt-0.5" *ngIf="!selectedRouteId()">{{ filteredRoutes().length }} เส้นทางที่เปิดให้บริการ</p>
          </div>
          <div class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <mat-icon *ngIf="!selectedRouteId()">{{ isBottomSheetOpen ? 'expand_more' : 'expand_less' }}</mat-icon>
            <mat-icon *ngIf="selectedRouteId()" (click)="selectedRouteId.set(null); $event.stopPropagation(); updateMapLayers(routeService.routes())">close</mat-icon>
          </div>
        </div>
        
        <!-- Content List -->
        <div class="overflow-y-auto px-5 pt-5 pb-24 space-y-4 flex-1 custom-scrollbar bg-slate-50/50" [class.hidden]="!isBottomSheetOpen && !selectedRouteId()">
          <ng-container *ngTemplateOutlet="selectedRouteId() ? routeDetails : routeList"></ng-container>
        </div>
      </div>

      <!-- Map Overlay Controls -->
      <div class="absolute right-4 top-20 md:top-4 z-[400]">
        <button (click)="toggleMapMode()" class="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/60 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-white active:scale-95 transition-all">
          <mat-icon>{{ isSatelliteMode ? 'map' : 'satellite' }}</mat-icon>
        </button>
      </div>

      <!-- Route Details Template -->
      <ng-template #routeDetails>
         @if(getSelectedRoute(); as route) {
            <div class="animate-in fade-in slide-in-from-bottom-4 duration-300">
               <!-- Main Card -->
               <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 mb-4">
                  <div class="flex items-start gap-4 mb-5">
                    <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-inner shrink-0" [style.backgroundColor]="route.color">
                      {{ route.number }}
                    </div>
                    <div class="flex-1">
                       <h3 class="font-black text-xl text-slate-900 leading-tight mb-2">{{ route.name }}</h3>
                       <div class="flex items-center gap-2">
                           <!-- Primary Line Color -->
                           <div class="w-4 h-4 rounded-full border border-slate-200 shadow-inner" [style.backgroundColor]="route.color" title="สีเส้นทาง"></div>
                           <!-- Optional Secondary Color -->
                           <div *ngIf="route.vehicleColors && route.vehicleColors.length > 0" class="flex gap-1">
                               <div *ngFor="let c of route.vehicleColors" class="w-4 h-4 rounded-full border border-slate-200 shadow-inner" [style.backgroundColor]="c" title="สีตัวรถ"></div>
                           </div>
                           <span class="text-xs text-slate-500 font-medium">สีเส้นทาง / สีตัวรถ</span>
                       </div>
                    </div>
                  </div>

                  <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                     <div class="flex-1 text-center">
                        <div class="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">ต้นทาง</div>
                        <div class="font-semibold text-slate-800 text-sm truncate px-1">{{ route.origin }}</div>
                     </div>
                     <mat-icon class="text-blue-600 px-2 shrink-0">trending_flat</mat-icon>
                     <div class="flex-1 text-center">
                        <div class="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">ปลายทาง</div>
                        <div class="font-semibold text-slate-800 text-sm truncate px-1">{{ route.destination }}</div>
                     </div>
                  </div>
               </div>
               
               <!-- Waypoints Timeline -->
               <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
                 <h4 class="font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                   <mat-icon class="text-blue-600">room</mat-icon> จุดจอดสำคัญ
                 </h4>
                 
                 <div class="relative pl-3 space-y-6 before:absolute before:inset-0 before:ml-5 before:w-0.5 before:bg-slate-200">
                    @for(wp of route.waypoints; track $index) {
                      <div class="relative flex items-start gap-4">
                        <div class="w-5 h-5 bg-white border-4 border-blue-500 rounded-full z-10 mt-0.5"></div>
                        <div class="flex-1 pb-1">
                          <p class="font-bold text-slate-800 text-sm">{{ wp.name || 'จุดจอดที่ ' + ($index + 1) }}</p>
                        </div>
                      </div>
                    }
                    @if(route.waypoints.length === 0) {
                      <div class="text-center text-slate-400 py-4 text-sm font-medium">ไม่มีข้อมูลจุดจอด</div>
                    }
                 </div>
               </div>
            </div>
         }
      </ng-template>

      <!-- Reusable Route List Template -->
      <ng-template #routeList>
        <div #listContainer>
          @for (route of filteredRoutes(); track route.id) {
            <div class="route-item p-4 rounded-3xl border border-slate-200/60 bg-white shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-[0.98] mb-4 group" (click)="toggleRoute(route)">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-full flex items-center justify-center text-white font-extrabold text-xl shadow-inner group-hover:scale-105 transition-transform" [style.backgroundColor]="route.color">
                    {{ route.number }}
                  </div>
                  <div>
                    <h3 class="font-bold text-[17px] text-slate-900 leading-tight">{{ route.name }}</h3>
                    <p class="text-[13px] text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                      <span class="truncate max-w-[100px]">{{ route.origin }}</span>
                      <mat-icon class="text-[14px] w-[14px] h-[14px] opacity-50">arrow_forward</mat-icon>
                      <span class="truncate max-w-[100px]">{{ route.destination }}</span>
                    </p>
                  </div>
                </div>
                 <button class="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-slate-50 text-slate-400 border border-slate-100"
                         [ngClass]="isSelected(route.id!) ? '!bg-blue-500 !text-white !border-blue-500 shadow-md transform scale-110' : 'hover:bg-slate-100'">
                   <mat-icon class="text-[20px] w-[20px] h-[20px]">{{ isSelected(route.id!) ? 'visibility' : 'visibility_off' }}</mat-icon>
                 </button>
               </div>
             </div>
           }
           @if (filteredRoutes().length === 0) {
             <div class="flex flex-col items-center justify-center py-12 text-slate-400">
               <mat-icon class="text-6xl mb-4 opacity-20">search_off</mat-icon>
               <p class="text-base font-medium">ไม่พบสายรถที่ค้นหา</p>
             </div>
           }
         </div>
       </ng-template>
 
     </div>
   `,
   styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #e2e8f0;
      border-radius: 20px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: #cbd5e1;
    }
  `]
})
export class MapPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @ViewChild('searchBar') searchBar?: ElementRef;
  @ViewChild('bottomSheet') bottomSheet?: ElementRef;
  @ViewChild('listContainer') listContainer?: ElementRef;
  
  routeService = inject(RouteService);
  placeService = inject(PlaceService);
  platformId = inject(PLATFORM_ID);
  
  L: any;
  map!: any;
  searchQuery = '';
  filteredRoutes = signal<Route[]>([]);
  // Used instead of visibleRouteIds
  selectedRouteId = signal<string | null>(null);
  
  routeLayers = new Map<string, any>();
  placeLayers = new Map<string, any>();
  
  isBottomSheetOpen = false;
  isSatelliteMode = false;
  
  baseLayers: any = {};

  constructor() {
    effect(() => {
      const routes = this.routeService.routes();
      const places = this.placeService.places();
      this.filterRoutes();
      if (this.map) {
        this.updateMapLayers(routes);
        this.updatePlaceLayers(places);
      }
    });
  }

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.L = await import('leaflet');
      (window as any).L = this.L; // Expose globally for plugins
      await import('leaflet-polylineoffset');
      this.initMap();
      this.updateMapLayers(this.routeService.routes());
      this.updatePlaceLayers(this.placeService.places());
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Entrance animations
      if (this.searchBar?.nativeElement) {
        animate(
          this.searchBar.nativeElement,
          { opacity: [0, 1], y: [-20, 0] },
          { duration: 0.6, ease: "backOut" }
        );
      }
      
      if (this.bottomSheet?.nativeElement) {
        animate(
          this.bottomSheet.nativeElement,
          { opacity: [0, 1], y: [50, 0] },
          { duration: 0.6, delay: 0.2, ease: "backOut" }
        );
      }
    }
  }

  initMap() {
    if (!this.L) return;
    const koratCenter = [14.9799, 102.0978];
    this.map = this.L.map(this.mapContainer.nativeElement, {
      zoomControl: false,
      attributionControl: false
    }).setView(koratCenter, 13);

    this.L.control.zoom({ position: 'topright' }).addTo(this.map);

    this.baseLayers['street'] = this.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(this.map);
    
    this.baseLayers['satellite'] = this.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19
    });
    
    // Invalidate size to ensure it fills safely on mobile
    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);
    
    // Listen for zoom events to adjust marker sizes and line weights
    this.map.on('zoomend', () => {
      this.updateMapLayers(this.routeService.routes());
      this.updatePlaceLayers(this.placeService.places());
    });
  }

  toggleMapMode() {
    if (!this.map || !this.L) return;
    
    this.isSatelliteMode = !this.isSatelliteMode;
    if (this.isSatelliteMode) {
      this.map.removeLayer(this.baseLayers['street']);
      this.map.addLayer(this.baseLayers['satellite']);
    } else {
      this.map.removeLayer(this.baseLayers['satellite']);
      this.map.addLayer(this.baseLayers['street']);
    }
  }

  filterRoutes() {
    const query = this.searchQuery.toLowerCase();
    const allRoutes = this.routeService.routes().filter(r => r.isActive);
    if (!query) {
      this.filteredRoutes.set(allRoutes);
    } else {
      this.filteredRoutes.set(allRoutes.filter(r => 
        r.name.toLowerCase().includes(query) || 
        r.number.toLowerCase().includes(query) ||
        r.origin.toLowerCase().includes(query) ||
        r.destination.toLowerCase().includes(query) ||
        r.waypoints.some(wp => wp.name.toLowerCase().includes(query))
      ));
    }
  }

  updateMapLayers(routes: Route[]) {
    if (!this.map || !this.L) return;

    this.routeLayers.forEach(layer => this.map.removeLayer(layer));
    this.routeLayers.clear();

    const allActiveRoutes = this.routeService.routes().filter(r => r.isActive);

    routes.filter(r => r.isActive).forEach(route => {
      if (!route.id) return;
      
      const layerGroup = this.L.layerGroup();
      
      const isSelected = this.selectedRouteId() === route.id;
      const isAnythingSelected = this.selectedRouteId() !== null;
      
      // Calculate offset based on route position to prevent multiple routes overlapping
      // We start at 6 and alternate left/right, extending outward
      const routeIndex = allActiveRoutes.findIndex(r => r.id === route.id);
      const offsetSequence = [4, -4, 10, -10, 16, -16, 22, -22];
      const lineOffset = offsetSequence[routeIndex % offsetSequence.length] || 4;
      
      // Determine styling based on selection state and zoom
      let lineOpacity = 0.9;
      let lineWeight = this.map.getZoom() < 13 ? 4 : 5;
      let markerOpacity = 1.0;
      let isVisible = true;
      
      if (isAnythingSelected) {
          if (isSelected) {
             lineWeight += 2; // Thicker for selected
             layerGroup.setZIndex(100); // Bring to front
          } else {
             lineOpacity = 0.15; // Very transparent
             markerOpacity = 0.3;
             layerGroup.setZIndex(10); // Send to back
             if (this.map.getZoom() < 13) {
                 isVisible = false; // Hide completely when zoomed out to reduce clutter
             }
          }
      }
      
      if (route.geojson && isVisible) {
        try {
          const geojson = JSON.parse(route.geojson);
          this.L.geoJSON(geojson, {
            style: {
              color: route.color,
              weight: lineWeight,
              opacity: lineOpacity,
              lineCap: 'round',
              lineJoin: 'round',
              offset: lineOffset // Offset the line to prevent overlap!
            }
          }).addTo(layerGroup);
        } catch (e) {
          console.error('Invalid GeoJSON for route', route.id);
        }
      }

      if (isVisible) {
          const markerSize = this.map.getZoom() < 13 ? 16 : 28;
          const markerRadius = this.map.getZoom() < 13 ? 6 : 12;
          const innerRadius = this.map.getZoom() < 13 ? 3 : 4;
          const offset = markerSize / 2;
          
          route.waypoints.forEach((wp, index) => {
            const markerSvg = `<svg width="${markerSize}" height="${markerSize}" viewBox="0 0 ${markerSize} ${markerSize}" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="${markerOpacity}">
              <circle cx="${offset}" cy="${offset}" r="${markerRadius}" fill="white" stroke="${route.color}" stroke-width="${this.map.getZoom() < 13 ? 2 : 4}"/>
              <circle cx="${offset}" cy="${offset}" r="${innerRadius}" fill="${route.color}"/>
            </svg>`;
            const iconUrl = 'data:image/svg+xml;base64,' + btoa(markerSvg);
            const icon = this.L.icon({ iconUrl, iconSize: [markerSize, markerSize], iconAnchor: [offset, offset] });
            
            const tooltipStr = wp.name ? wp.name : `จุดจอดที่ ${index + 1}`;
            
            const marker = this.L.marker([wp.lat, wp.lng], { icon });
            
            if (this.map.getZoom() >= 13) {
               marker.bindPopup(`
                <div class="text-center p-1">
                  <div class="font-bold text-slate-800 text-sm mb-1">${tooltipStr}</div>
                  <div class="inline-block px-2 py-1 rounded-md text-white text-xs font-bold" style="background-color: ${route.color}">
                    สาย ${route.number}
                  </div>
                </div>
               `, { className: 'custom-popup' });
            }
            
            marker.addTo(layerGroup);
          });
      }

      layerGroup.addTo(this.map);
      this.routeLayers.set(route.id, layerGroup);
    });
  }

  updatePlaceLayers(places: Place[]) {
    if (!this.map || !this.L) return;

    this.placeLayers.forEach(layer => this.map.removeLayer(layer));
    this.placeLayers.clear();

    const zoom = this.map.getZoom();
    const size = zoom < 13 ? 20 : 28;
    const offset = size / 2;

    places.filter(p => p.isActive).forEach(place => {
      if (!place.id) return;
      
      const markerSvg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
         <path d="M${offset} 0C${offset*0.5} 0 2 ${offset*0.4} 2 ${size*0.4}C2 ${size*0.7} ${offset} ${size} ${offset} ${size}C${offset} ${size} ${size-2} ${size*0.7} ${size-2} ${size*0.4}C${size-2} ${offset*0.4} ${size*0.8} 0 ${offset} 0Z" fill="#4F46E5" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.25))"/>
         <circle cx="${offset}" cy="${size*0.4}" r="${size*0.15}" fill="#FFFFFF"/>
      </svg>`;
      const iconUrl = 'data:image/svg+xml;base64,' + btoa(markerSvg);
      const icon = this.L.icon({ iconUrl, iconSize: [size, size], iconAnchor: [offset, size] });

      const marker = this.L.marker([place.lat, place.lng], { 
        title: place.name,
        icon,
        zIndexOffset: 1000 
      }).bindTooltip(
        `<div class="font-bold text-[11px] text-slate-800 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-md border border-slate-200/60 flex items-center justify-center gap-1.5 whitespace-nowrap"><span class="material-icons text-[14px] text-indigo-600">${place.icon || 'star'}</span>${place.name}</div>`,
        { 
          permanent: true, 
          direction: 'bottom', 
          className: 'bg-transparent border-0 shadow-none mt-1 p-0',
          offset: [0, 4]
        }
      );

      marker.addTo(this.map);
      this.placeLayers.set(place.id, marker);
    });
  }

  toggleRoute(route: Route) {
    if (!route.id) return;
    
    if (this.selectedRouteId() === route.id) {
       this.selectedRouteId.set(null); // Deselect
    } else {
       this.selectedRouteId.set(route.id);
       
       // Center map on route geometry if geojson exists
       if (route.geojson) {
          try {
              const geojson = JSON.parse(route.geojson);
              const layer = this.L.geoJSON(geojson);
              this.map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 16 });
          } catch(e) {}
       }
    }
    
    // Re-render layers to apply selection styles
    this.updateMapLayers(this.routeService.routes());
  }

  isSelected(routeId: string): boolean {
    return this.selectedRouteId() === routeId;
  }

  getSelectedRoute(): Route | undefined {
     return this.routeService.routes().find(r => r.id === this.selectedRouteId());
  }

  toggleBottomSheet() {
    this.isBottomSheetOpen = !this.isBottomSheetOpen;
    
    if (isPlatformBrowser(this.platformId) && this.bottomSheet?.nativeElement) {
      animate(
        this.bottomSheet.nativeElement,
        { height: this.isBottomSheetOpen ? '80dvh' : '100px' },
        { duration: 0.5, ease: "easeOut" }
      );

      if (this.isBottomSheetOpen) {
        const items = this.bottomSheet.nativeElement.querySelectorAll('.route-item');
        if (items && items.length > 0) {
          animate(
            items,
            { opacity: [0, 1], y: [20, 0] },
            { duration: 0.4, delay: stagger(0.05), ease: 'easeOut' }
          );
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}

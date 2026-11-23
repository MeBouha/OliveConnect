import { AfterViewInit, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { OrchardDataService } from '../../core/domain.services';

@Component({
  selector: 'app-orchard-map',
  standalone: true,
  template: `
    <h1 class="page-title">Carte des oliveraies</h1>
    <div #mapElement class="map"></div>
  `,
  styles: [`.map { height: 620px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12); }`]
})
export class OrchardMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapElement') mapElement!: ElementRef<HTMLDivElement>;

  private readonly service = inject(OrchardDataService);
  private map?: L.Map;

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement.nativeElement).setView([35.2, 10.8], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    this.service.map().subscribe(markers => {
      markers.forEach(marker => {
        const [lng, lat] = marker.geometry.coordinates;
        L.circleMarker([lat, lng], { radius: 7, color: '#2e7d32', fillOpacity: 0.8 })
          .bindPopup(`${marker.name}<br>${marker.variety}<br>${marker.areaHa} ha`)
          .addTo(this.map!);
      });
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}

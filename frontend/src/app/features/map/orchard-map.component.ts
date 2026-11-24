import { DecimalPipe } from '@angular/common';
import { AfterViewInit, Component, computed, ElementRef, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';
import { OrchardDataService } from '../../core/domain.services';
import { OrchardMapView } from '../../core/models';
import { NotifyService } from '../../shared/feedback';
import { labelOf } from '../../shared/labels';
import { PageHeaderComponent } from '../../shared/ui';

interface Band {
  key: string;
  label: string;
  color: string;
  test: (level: number | null) => boolean;
}

const BANDS: Band[] = [
  { key: 'unknown', label: 'Pas de mesure', color: '#a3a89c', test: level => level === null },
  { key: 'green', label: '< 50 % — vert', color: '#9db86f', test: level => level !== null && level < 50 },
  { key: 'turning', label: '50–70 % — véraison', color: '#5f8a3a', test: level => level !== null && level >= 50 && level < 70 },
  { key: 'ready', label: '≥ 70 % — prêt à récolter', color: '#c99a26', test: level => level !== null && level >= 70 }
];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

@Component({
  selector: 'app-orchard-map',
  standalone: true,
  imports: [DecimalPipe, MatIconModule, PageHeaderComponent],
  template: `
    <div class="page">
      <app-page-header title="Carte des oliveraies" icon="map"
                       subtitle="Maturité des olives et état des récoltes, région de Sfax" />

      <section class="stats">
        <div class="stat"><strong>{{ visible().length }}</strong><span>oliveraies affichées</span></div>
        <div class="stat"><strong>{{ totalArea() | number: '1.0-0' }} ha</strong><span>superficie</span></div>
        <div class="stat"><strong>{{ avgMaturity() | number: '1.0-0' }} %</strong><span>maturité moyenne</span></div>
        <div class="stat gold"><strong>{{ readyCount() }}</strong><span>prêtes à récolter</span></div>
      </section>

      <div class="filters" role="group" aria-label="Filtrer par variété">
        <button type="button" class="filter" [class.on]="!variety()" (click)="setVariety(null)">Toutes</button>
        @for (v of varieties(); track v) {
          <button type="button" class="filter" [class.on]="variety() === v" (click)="setVariety(v)">{{ v }}</button>
        }
      </div>

      <div class="map-wrap">
        <div #mapElement class="map" role="region" aria-label="Carte interactive"></div>
        @if (loading()) {
          <div class="loading"><span class="skeleton"></span> Chargement des oliveraies…</div>
        }
        <div class="legend">
          <strong>Maturité</strong>
          @for (band of bands; track band.key) {
            <div class="legend-row"><span class="dot" [style.background]="band.color"></span>{{ band.label }}</div>
          }
          <div class="legend-row"><span class="dot ring"></span>Récolte planifiée / en cours</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr)); gap: 12px; }
    .stat { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; display: flex; flex-direction: column; }
    .stat strong { font-size: 20px; font-variant-numeric: tabular-nums; }
    .stat span { font-size: 12px; color: var(--ink-3); }
    .stat.gold strong { color: var(--gold-600); }
    .filters { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter {
      padding: 6px 14px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface);
      font: inherit; font-size: 13px; font-weight: 500; color: var(--ink-2); cursor: pointer;
    }
    .filter:hover { border-color: var(--olive-300); }
    .filter.on { background: var(--olive-700); border-color: var(--olive-700); color: #fff; }
    .map-wrap { position: relative; }
    .map ::ng-deep .leaflet-tile-pane { filter: saturate(0.45) brightness(1.04) contrast(0.95); }
    .map {
      height: clamp(420px, calc(100vh - 360px), 760px); border-radius: var(--radius);
      border: 1px solid var(--border); box-shadow: var(--shadow-sm); z-index: 0;
    }
    .legend {
      position: absolute; right: 12px; bottom: 24px; z-index: 500; background: rgba(255, 255, 255, 0.95);
      border-radius: 12px; padding: 12px 14px; box-shadow: var(--shadow); font-size: 12px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .legend strong { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-3); }
    .legend-row { display: flex; align-items: center; gap: 8px; color: var(--ink-2); }
    .dot { width: 12px; height: 12px; border-radius: 50%; flex: none; border: 1.5px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,0.15); }
    .dot.ring { background: #fff; border: 2.5px solid var(--info); box-shadow: none; }
    .loading {
      position: absolute; top: 12px; left: 50%; transform: translateX(-50%); z-index: 500;
      background: #fff; padding: 8px 14px; border-radius: 999px; box-shadow: var(--shadow); font-size: 13px;
      display: flex; align-items: center; gap: 8px;
    }
    .loading .skeleton { width: 14px; height: 14px; border-radius: 50%; }
    @media (max-width: 640px) { .legend { left: 12px; right: auto; bottom: 12px; } }
  `]
})
export class OrchardMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapElement') mapElement!: ElementRef<HTMLDivElement>;

  private readonly service = inject(OrchardDataService);
  private readonly notify = inject(NotifyService);
  private map?: L.Map;
  private layer?: L.LayerGroup;

  readonly bands = BANDS;
  readonly loading = signal(true);
  readonly markers = signal<OrchardMapView[]>([]);
  readonly variety = signal<string | null>(null);
  readonly varieties = computed(() => [...new Set(this.markers().map(m => m.variety))].sort());
  readonly visible = computed(() => this.markers().filter(m => !this.variety() || m.variety === this.variety()));
  readonly totalArea = computed(() => this.visible().reduce((sum, m) => sum + m.areaHa, 0));
  readonly avgMaturity = computed(() => {
    const levels = this.visible().map(m => m.maturityLevel).filter((l): l is number => l !== null);
    return levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
  });
  readonly readyCount = computed(() => this.visible().filter(m => (m.maturityLevel ?? 0) >= 70).length);

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement.nativeElement, { zoomControl: true }).setView([34.76, 10.78], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);
    this.layer = L.layerGroup().addTo(this.map);

    this.service.map().subscribe({
      next: markers => {
        this.markers.set(markers);
        this.loading.set(false);
        this.render(true);
      },
      error: error => {
        this.loading.set(false);
        this.notify.error(error);
      }
    });
  }

  setVariety(value: string | null): void {
    this.variety.set(value);
    this.render(false);
  }

  private render(fit: boolean): void {
    if (!this.map || !this.layer) {
      return;
    }
    this.layer.clearLayers();
    const points: L.LatLngExpression[] = [];
    for (const marker of this.visible()) {
      const [lng, lat] = marker.geometry.coordinates;
      const band = BANDS.find(b => b.test(marker.maturityLevel)) ?? BANDS[0];
      const active = marker.harvestStatus === 'PLANNED' || marker.harvestStatus === 'IN_PROGRESS';
      points.push([lat, lng]);
      L.circleMarker([lat, lng], {
        radius: 4 + Math.min(marker.areaHa, 20) / 4,
        color: active ? '#2f6690' : '#ffffff',
        weight: active ? 3 : 1.5,
        fillColor: band.color,
        fillOpacity: 0.9
      })
        .bindPopup(this.popup(marker))
        .addTo(this.layer);
    }
    if (fit && points.length) {
      this.map.fitBounds(L.latLngBounds(points), { padding: [24, 24] });
    }
  }

  private popup(marker: OrchardMapView): string {
    const status = marker.harvestStatus ? labelOf('harvestStatus', marker.harvestStatus).label : 'Aucune';
    const maturity = marker.maturityLevel === null ? '—' : `${marker.maturityLevel} %`;
    return `
      <div class="map-popup">
        <strong>${escapeHtml(marker.name)}</strong>
        <div class="row"><span>Variété</span><span>${escapeHtml(marker.variety)}</span></div>
        <div class="row"><span>Superficie</span><span>${marker.areaHa.toLocaleString('fr-FR')} ha</span></div>
        <div class="row"><span>Maturité</span><span>${maturity}</span></div>
        <div class="row"><span>Dernière récolte</span><span>${status}</span></div>
      </div>`;
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
